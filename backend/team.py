# Assembles the Planner, Researcher, Executor, etc.
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_agentchat.conditions import TextMentionTermination, MaxMessageTermination
from autogen_ext.models.openai import OpenAIChatCompletionClient
from backend.config import settings
from backend.tools import duckduckgo_tool, calendar_tool

def build_orchestrai_team():
    # model_info is required for non-OpenAI model names
    from autogen_core.models import ModelInfo

    def make_client(api_key: str) -> OpenAIChatCompletionClient:
        return OpenAIChatCompletionClient(
            model=settings.GEMINI_MODEL,
            api_key=api_key,
            base_url=settings.GEMINI_BASE_URL,
            model_info=ModelInfo(
                vision=False,
                function_calling=True,
                json_output=True,
                family="unknown",
                structured_output=False,
            ),
        )

    # Each agent gets its own key to distribute rate limits
    planner_client   = make_client(settings.GEMINI_API_KEY_PLANNER)
    researcher_client = make_client(settings.GEMINI_API_KEY_RESEARCHER)
    executor_client  = make_client(settings.GEMINI_API_KEY_EXECUTOR)
    reviewer_client  = make_client(settings.GEMINI_API_KEY_REVIEWER)

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
    # Stop if the Reviewer calls for HITL, or as a fallback stop after 15 messages to save tokens.
    hitl_termination = TextMentionTermination("STATUS: PENDING_APPROVAL")
    fallback_termination = MaxMessageTermination(max_messages=15)
    termination_condition = hitl_termination | fallback_termination

    # -- Create Team --
    team = RoundRobinGroupChat(
        participants=[planner, researcher, executor, reviewer],
        termination_condition=termination_condition
    )
    
    return team