# Assembles the Planner, Researcher, Executor, etc.
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_agentchat.conditions import TextMentionTermination, MaxMessageTermination
from autogen_ext.models.openai import OpenAIChatCompletionClient
from backend.config import settings
from backend.tools import duckduckgo_tool, calendar_tool

def build_orchestrai_team(is_approved: bool = False):
    # model_info is required for non-OpenAI model names
    from autogen_core.models import ModelInfo
    
    def make_client(api_key: str, model_name: str) -> OpenAIChatCompletionClient:
        return OpenAIChatCompletionClient(
            model=model_name,
            api_key=api_key,
            base_url=settings.GROQ_BASE_URL,
            model_info=ModelInfo(
                vision=False,
                function_calling=True,
                json_output=True,
                family="unknown",
                structured_output=False,
            ),
        )

    # Model 1: gpt-oss-120b (Researcher / Executor)
    # Model 2: llama-3.3-70b-versatile (Planner / Reviewer)
    planner_client    = make_client(settings.GROQ_API_KEY_2, settings.GROQ_MODEL_2)
    reviewer_client   = make_client(settings.GROQ_API_KEY_2, settings.GROQ_MODEL_2)
    
    researcher_client = make_client(settings.GROQ_API_KEY_1, settings.GROQ_MODEL_1)
    executor_client   = make_client(settings.GROQ_API_KEY_1, settings.GROQ_MODEL_1)

    # -- Define Agents --
    planner = AssistantAgent(
        name="Planner",
        model_client=planner_client,
        system_message="You are the Architect. Decompose the user's objective into a step-by-step plan. Assign steps to Researcher or Executor. Do NOT execute tools yourself."
    )

    researcher = AssistantAgent(
        name="Researcher",
        model_client=researcher_client,
        tools=[duckduckgo_tool],
        system_message="You are the Context Gatherer. Use search tools to find facts. Return clear data for the Executor to use."
    )

    executor = AssistantAgent(
        name="Executor",
        model_client=executor_client,
        tools=[calendar_tool],
        system_message="You are the Executor. You execute APIs based on the Planner's instructions and Researcher's data."
    )

    reviewer = AssistantAgent(
        name="Reviewer",
        model_client=reviewer_client,
        system_message="You are Quality Control. Review the Executor's output. If correct and ready for human approval, strictly output exactly 'STATUS: PENDING_APPROVAL'. If flawed, provide feedback for the Executor."
    )

    # -- Terminations --
    # Stop if the Reviewer calls for HITL, or as a fallback stop after 30 messages to save tokens.
    fallback_termination = MaxMessageTermination(max_messages=30)
    
    if is_approved:
        success_termination = TextMentionTermination("COMPLETE_WORKFLOW")
        termination_condition = success_termination | fallback_termination
    else:
        hitl_termination = TextMentionTermination("STATUS: PENDING_APPROVAL")
        termination_condition = hitl_termination | fallback_termination

    # -- Create Team --
    team = RoundRobinGroupChat(
        participants=[planner, researcher, executor, reviewer],
        termination_condition=termination_condition
    )
    
    return team