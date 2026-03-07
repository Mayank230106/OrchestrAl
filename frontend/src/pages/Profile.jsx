import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { 
  User, 
  Mail, 
  GraduationCap, 
  Github, 
  Link as LinkIcon, 
  FileText, 
  Wrench, 
  Camera, 
  X,
  Save
} from 'lucide-react';

const Profile = () => {
  // Initial state populated with functional placeholder data
  const [formData, setFormData] = useState({
    fullName: 'Shashank',
    email: 'shashank@example.com',
    collegeEmail: 'shashank@college.edu',
    githubUsername: 'shashank2327',
    githubUrl: 'https://github.com/shashank2327',
    bio: 'Passionate about competitive programming, scalable web development, and cloud architecture.',
  });

  const [skills, setSkills] = useState(['Java', 'C++', 'JavaScript', 'AWS', 'Docker']);
  const [skillInput, setSkillInput] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim() !== '') {
      e.preventDefault();
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()]);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="w-full max-w-4xl mx-auto">
            
            {/* Profile Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              
              {/* Header Section */}
              <div className="p-8 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  {/* Avatar with Camera Badge */}
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                      <User size={48} strokeWidth={1.5} />
                    </div>
                    <button className="absolute bottom-0 right-0 p-2 bg-white border border-gray-200 rounded-full text-slate-700 hover:text-black hover:border-black transition-colors shadow-sm">
                      <Camera size={16} />
                    </button>
                  </div>
                  
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">{formData.fullName}</h1>
                    <p className="text-gray-500 font-medium">@{formData.githubUsername}</p>
                  </div>
                </div>

                <button className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium shadow-sm">
                  <Save size={18} />
                  Save Changes
                </button>
              </div>

              {/* Form Section */}
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <User size={16} className="text-gray-400" /> Full Name
                    </label>
                    <input 
                      type="text" 
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                    />
                  </div>

                  {/* Email Address (Read-only) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <Mail size={16} className="text-gray-400" /> Email Address
                      </label>
                      <span className="text-xs text-gray-400 font-medium">(Read-only)</span>
                    </div>
                    <input 
                      type="email" 
                      value={formData.email}
                      readOnly
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 focus:outline-none cursor-not-allowed"
                    />
                  </div>

                  {/* College Email (Read-only) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <GraduationCap size={16} className="text-gray-400" /> College Email
                      </label>
                      <span className="text-xs text-gray-400 font-medium">(Read-only)</span>
                    </div>
                    <input 
                      type="email" 
                      value={formData.collegeEmail}
                      readOnly
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 focus:outline-none cursor-not-allowed"
                    />
                  </div>

                  {/* GitHub Username */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <Github size={16} className="text-gray-400" /> GitHub Username
                    </label>
                    <input 
                      type="text" 
                      name="githubUsername"
                      value={formData.githubUsername}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                    />
                  </div>
                </div>

                {/* GitHub Profile URL */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <LinkIcon size={16} className="text-gray-400" /> GitHub Profile URL
                  </label>
                  <input 
                    type="url" 
                    name="githubUrl"
                    value={formData.githubUrl}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                  />
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <FileText size={16} className="text-gray-400" /> Bio
                  </label>
                  <textarea 
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors resize-none"
                  ></textarea>
                </div>

                {/* Skills Component */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Wrench size={16} className="text-gray-400" /> Skills
                  </label>
                  
                  <div className="w-full min-h-[52px] px-4 py-2 rounded-xl border border-gray-300 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-colors flex flex-wrap items-center gap-2 bg-white">
                    {skills.map((skill, index) => (
                      <span 
                        key={index} 
                        className="flex items-center gap-1 bg-gray-100 text-slate-800 border border-gray-200 px-3 py-1 rounded-lg text-sm font-medium"
                      >
                        {skill}
                        <button 
                          onClick={() => removeSkill(skill)}
                          className="text-gray-400 hover:text-black transition-colors ml-1 focus:outline-none"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                    <input 
                      type="text" 
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleAddSkill}
                      placeholder="Type a skill and press Enter"
                      className="flex-1 min-w-[200px] outline-none text-slate-700 bg-transparent py-1"
                    />
                  </div>
                </div>

              </div>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;