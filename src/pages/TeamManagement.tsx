import React, { useState } from 'react';
import { PlusIcon, SearchIcon, EditIcon, TrashIcon } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  status: 'active' | 'away' | 'offline';
}
const mockTeamMembers: TeamMember[] = [{
  id: '1',
  name: 'Emma Chen',
  email: 'emma@toiral.com',
  role: 'Creative Director',
  avatar: 'https://i.pravatar.cc/150?img=5',
  status: 'active'
}, {
  id: '2',
  name: 'Alex Kim',
  email: 'alex@toiral.com',
  role: 'Senior Designer',
  avatar: 'https://i.pravatar.cc/150?img=11',
  status: 'active'
}, {
  id: '3',
  name: 'Jordan Lee',
  email: 'jordan@toiral.com',
  role: 'UX Designer',
  avatar: 'https://i.pravatar.cc/150?img=32',
  status: 'away'
}, {
  id: '4',
  name: 'Sam Taylor',
  email: 'sam@toiral.com',
  role: 'Project Manager',
  avatar: 'https://i.pravatar.cc/150?img=15',
  status: 'active'
}, {
  id: '5',
  name: 'Jamie Wilson',
  email: 'jamie@toiral.com',
  role: 'Copywriter',
  avatar: 'https://i.pravatar.cc/150?img=23',
  status: 'offline'
}, {
  id: '6',
  name: 'Casey Morgan',
  email: 'casey@toiral.com',
  role: 'Developer',
  avatar: 'https://i.pravatar.cc/150?img=53',
  status: 'offline'
}];
const TeamManagement = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const filteredMembers = teamMembers.filter(member => member.name.toLowerCase().includes(searchQuery.toLowerCase()) || member.role.toLowerCase().includes(searchQuery.toLowerCase()) || member.email.toLowerCase().includes(searchQuery.toLowerCase()));
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-[#7eb8ab]';
      case 'away':
        return 'bg-[#b8b87e]';
      case 'offline':
        return 'bg-[#7a7067]';
      default:
        return 'bg-[#7a7067]';
    }
  };
  const {
    addNotification
  } = useNotifications();
  const handleAddTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const newMember: TeamMember = {
      id: `member-${Date.now()}`,
      name: formData.get('fullName') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as string,
      status: 'active',
      avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`
    };
    setTeamMembers([...teamMembers, newMember]);
    setIsModalOpen(false);
    addNotification({
      title: 'New Team Member Added',
      message: `${newMember.name} has joined the team as ${newMember.role}`,
      type: 'team'
    });
  };
  return <div>
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-['Caveat',_cursive] text-4xl text-[#3a3226] mb-2">
            Team Management
          </h1>
          <p className="text-[#7a7067]">
            Manage your team members and their roles
          </p>
        </div>
        <button className="flex items-center px-4 py-2 bg-[#d4a5a5] text-white rounded-lg mt-4 md:mt-0" onClick={() => setIsModalOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          <span>Add Team Member</span>
        </button>
      </header>
      <div className="bg-white rounded-xl p-6 mb-8">
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <SearchIcon className="h-5 w-5 text-[#7a7067]" />
          </div>
          <input type="text" className="bg-[#f5f0e8] text-[#3a3226] w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none" placeholder="Search team members..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f5f0e8]">
                <th className="text-left py-3 px-4 text-[#3a3226] font-medium">
                  Name
                </th>
                <th className="text-left py-3 px-4 text-[#3a3226] font-medium">
                  Role
                </th>
                <th className="text-left py-3 px-4 text-[#3a3226] font-medium hidden md:table-cell">
                  Email
                </th>
                <th className="text-left py-3 px-4 text-[#3a3226] font-medium">
                  Status
                </th>
                <th className="text-right py-3 px-4 text-[#3a3226] font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map(member => <tr key={member.id} className="border-b border-[#f5f0e8] hover:bg-[#f5f0e8]/50">
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full mr-3" />
                      <span className="text-[#3a3226] font-medium">
                        {member.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-[#7a7067]">{member.role}</td>
                  <td className="py-4 px-4 text-[#7a7067] hidden md:table-cell">
                    {member.email}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(member.status)} mr-2`}></div>
                      <span className="text-[#7a7067] capitalize">
                        {member.status}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button className="text-[#7a7067] hover:text-[#3a3226] p-1">
                      <EditIcon className="h-4 w-4" />
                    </button>
                    <button className="text-[#7a7067] hover:text-[#d4a5a5] p-1 ml-2">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white rounded-xl p-6">
        <h2 className="font-['Caveat',_cursive] text-2xl text-[#3a3226] mb-4">
          Team Roles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border border-[#f5f0e8] rounded-lg p-4">
            <h3 className="text-[#3a3226] font-medium mb-2">
              Creative Director
            </h3>
            <p className="text-[#7a7067] text-sm mb-3">
              Oversees all creative projects and provides direction to the team.
            </p>
            <div className="flex items-center">
              <span className="text-xs text-white bg-[#d4a5a5] px-2 py-1 rounded-full">
                Admin Access
              </span>
            </div>
          </div>
          <div className="border border-[#f5f0e8] rounded-lg p-4">
            <h3 className="text-[#3a3226] font-medium mb-2">Senior Designer</h3>
            <p className="text-[#7a7067] text-sm mb-3">
              Creates high-level design concepts and mentors junior designers.
            </p>
            <div className="flex items-center">
              <span className="text-xs text-white bg-[#8ca3d8] px-2 py-1 rounded-full">
                Project Lead
              </span>
            </div>
          </div>
          <div className="border border-[#f5f0e8] rounded-lg p-4">
            <h3 className="text-[#3a3226] font-medium mb-2">UX Designer</h3>
            <p className="text-[#7a7067] text-sm mb-3">
              Focuses on user experience and interface design for digital
              products.
            </p>
            <div className="flex items-center">
              <span className="text-xs text-white bg-[#7eb8ab] px-2 py-1 rounded-full">
                Team Member
              </span>
            </div>
          </div>
          <div className="border border-[#f5f0e8] rounded-lg p-4">
            <h3 className="text-[#3a3226] font-medium mb-2">Project Manager</h3>
            <p className="text-[#7a7067] text-sm mb-3">
              Coordinates projects, timelines, and resources across the team.
            </p>
            <div className="flex items-center">
              <span className="text-xs text-white bg-[#8ca3d8] px-2 py-1 rounded-full">
                Project Lead
              </span>
            </div>
          </div>
          <div className="border border-[#f5f0e8] rounded-lg p-4">
            <h3 className="text-[#3a3226] font-medium mb-2">Copywriter</h3>
            <p className="text-[#7a7067] text-sm mb-3">
              Creates written content for various projects and campaigns.
            </p>
            <div className="flex items-center">
              <span className="text-xs text-white bg-[#7eb8ab] px-2 py-1 rounded-full">
                Team Member
              </span>
            </div>
          </div>
          <div className="border border-[#f5f0e8] rounded-lg p-4">
            <h3 className="text-[#3a3226] font-medium mb-2">Developer</h3>
            <p className="text-[#7a7067] text-sm mb-3">
              Implements designs and creates functional digital products.
            </p>
            <div className="flex items-center">
              <span className="text-xs text-white bg-[#7eb8ab] px-2 py-1 rounded-full">
                Team Member
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Add Team Member Modal */}
      {isModalOpen && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="font-['Caveat',_cursive] text-2xl text-[#3a3226]">
                Add Team Member
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#7a7067] hover:text-[#3a3226]">
                ✕
              </button>
            </div>
            <form onSubmit={handleAddTeamMember} className="space-y-4">
              <div>
                <label className="block text-[#3a3226] text-sm font-medium mb-2">
                  Full Name
                </label>
                <input type="text" name="fullName" className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]" placeholder="Enter full name" required />
              </div>
              <div>
                <label className="block text-[#3a3226] text-sm font-medium mb-2">
                  Email Address
                </label>
                <input type="email" name="email" className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]" placeholder="Enter email address" required />
              </div>
              <div>
                <label className="block text-[#3a3226] text-sm font-medium mb-2">
                  Role
                </label>
                <select name="role" className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]" required>
                  <option value="">Select a role</option>
                  <option value="Creative Director">Creative Director</option>
                  <option value="Senior Designer">Senior Designer</option>
                  <option value="UX Designer">UX Designer</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="Copywriter">Copywriter</option>
                  <option value="Developer">Developer</option>
                </select>
              </div>
              <div>
                <label className="block text-[#3a3226] text-sm font-medium mb-2">
                  Access Level
                </label>
                <select name="accessLevel" className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]" required>
                  <option value="">Select access level</option>
                  <option value="Admin">Admin Access</option>
                  <option value="Project Lead">Project Lead</option>
                  <option value="Team Member">Team Member</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" className="px-4 py-2 text-[#7a7067] bg-[#f5f0e8] rounded-lg" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-[#d4a5a5] text-white rounded-lg">
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>}
    </div>;
};
export default TeamManagement;