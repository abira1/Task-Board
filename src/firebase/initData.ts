// Default data for initializing the Firebase database

export const defaultUsers = [
  {
    name: 'Abir Hossain',
    email: 'abirsabirhossain@gmail.com',
    role: 'admin',
    avatar: 'https://i.pravatar.cc/150?img=1',
    approvalStatus: 'approved',
    joinedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString() // 30 days ago
  },
  {
    name: 'Emma Chen',
    email: 'emma@toiral.com',
    password: 'admin123',
    role: 'admin',
    avatar: 'https://i.pravatar.cc/150?img=5',
    approvalStatus: 'approved',
    joinedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString() // 25 days ago
  },
  {
    name: 'Alex Kim',
    email: 'alex@toiral.com',
    password: 'team123',
    role: 'team_member',
    avatar: 'https://i.pravatar.cc/150?img=11',
    approvalStatus: 'approved',
    joinedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(), // 20 days ago
    approvedBy: {
      id: 'admin1',
      name: 'Abir Hossain',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 19).toISOString() // 19 days ago
    }
  },
  {
    name: 'Jordan Lee',
    email: 'jordan@toiral.com',
    password: 'team123',
    role: 'team_member',
    avatar: 'https://i.pravatar.cc/150?img=32',
    approvalStatus: 'approved',
    joinedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(), // 15 days ago
    approvedBy: {
      id: 'admin1',
      name: 'Abir Hossain',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString() // 14 days ago
    }
  },
  {
    name: 'Sam Taylor',
    email: 'sam@toiral.com',
    password: 'team123',
    role: 'team_member',
    avatar: 'https://i.pravatar.cc/150?img=33',
    approvalStatus: 'pending',
    joinedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() // 2 days ago
  },
  {
    name: 'Jamie Wilson',
    email: 'jamie@toiral.com',
    password: 'team123',
    role: 'team_member',
    avatar: 'https://i.pravatar.cc/150?img=60',
    approvalStatus: 'pending',
    joinedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString() // 1 day ago
  }
];

export const defaultTasks = [
  {
    title: 'Update website homepage',
    description: 'Implement new hero section and update content',
    status: 'todo',
    priority: 'High',
    dueDate: new Date(2024, 0, 15).toISOString(),
    assignee: {
      name: 'Emma Chen',
      avatar: 'https://i.pravatar.cc/150?img=5'
    }
  },
  {
    title: 'Design social media graphics',
    description: 'Create templates for Instagram and Twitter',
    status: 'inProgress',
    priority: 'Medium',
    dueDate: new Date(2024, 0, 20).toISOString(),
    assignee: {
      name: 'Alex Kim',
      avatar: 'https://i.pravatar.cc/150?img=11'
    }
  },
  {
    title: 'Develop mobile app prototype',
    description: 'Create interactive prototype for client review',
    status: 'todo',
    priority: 'High',
    dueDate: new Date(2024, 0, 25).toISOString(),
    assignee: {
      name: 'Jordan Lee',
      avatar: 'https://i.pravatar.cc/150?img=32'
    }
  },
  {
    title: 'Write content for blog posts',
    description: 'Create 3 articles for the company blog',
    status: 'inProgress',
    priority: 'Medium',
    dueDate: new Date(2024, 0, 18).toISOString(),
    assignee: {
      name: 'Emma Chen',
      avatar: 'https://i.pravatar.cc/150?img=5'
    }
  },
  {
    title: 'Update product documentation',
    description: 'Review and update user guides for recent changes',
    status: 'done',
    priority: 'Low',
    dueDate: new Date(2024, 0, 10).toISOString(),
    assignee: {
      name: 'Alex Kim',
      avatar: 'https://i.pravatar.cc/150?img=11'
    }
  }
];

export const defaultNotifications = [
  {
    title: 'New Task Assigned',
    message: 'You have been assigned to the Website Redesign task',
    type: 'task',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false
  },
  {
    title: 'Team Meeting',
    message: 'Weekly team meeting starts in 30 minutes',
    type: 'event',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    read: false
  }
];

export const defaultEvents = [
  {
    title: 'Team Weekly Meeting',
    date: new Date(2023, 6, 10, 10, 0).toISOString(),
    type: 'meeting'
  },
  {
    title: 'Client Presentation',
    date: new Date(2023, 6, 12, 14, 0).toISOString(),
    type: 'meeting',
    assignee: {
      name: 'Emma Chen',
      avatar: 'https://i.pravatar.cc/150?img=5'
    }
  },
  {
    title: 'Website Redesign Deadline',
    date: new Date(2023, 6, 15).toISOString(),
    type: 'deadline'
  },
  {
    title: 'Finalize Marketing Assets',
    date: new Date(2023, 6, 18).toISOString(),
    type: 'task',
    assignee: {
      name: 'Jordan Lee',
      avatar: 'https://i.pravatar.cc/150?img=32'
    }
  },
  {
    title: 'Quarterly Planning',
    date: new Date(2023, 6, 25, 9, 0).toISOString(),
    type: 'meeting'
  },
  {
    title: 'Brand Guidelines Review',
    date: new Date(2023, 6, 20).toISOString(),
    type: 'task',
    assignee: {
      name: 'Alex Kim',
      avatar: 'https://i.pravatar.cc/150?img=11'
    }
  }
];

export const defaultLeads = [
  {
    companyName: 'BrewNest Cafe',
    contactPersonName: 'Sarah Johnson',
    businessType: 'Cafe',
    socialMedia: 'instagram.com/brewNestCafe',
    email: 'hello@brewNestCafe.com',
    fullName: 'Sarah Johnson',
    progress: 'In Progress',
    handledBy: {
      name: 'Emma Chen',
      avatar: 'https://i.pravatar.cc/150?img=5'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
  },
  {
    companyName: 'GlowCraft Studio',
    contactPersonName: 'Mia Rodriguez',
    businessType: 'Salon & Beauty',
    socialMedia: 'instagram.com/glowcraftstudio',
    email: 'contact@glowcraftstudio.com',
    fullName: 'Mia Rodriguez',
    progress: 'In Progress',
    handledBy: {
      name: 'Alex Kim',
      avatar: 'https://i.pravatar.cc/150?img=11'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
  },
  {
    companyName: 'PeakPixel Media',
    contactPersonName: 'David Chen',
    businessType: 'Creative Agency',
    socialMedia: 'peakpixelmedia.com',
    email: 'team@peakpixelmedia.com',
    fullName: 'David Chen',
    progress: 'Untouched',
    handledBy: {
      name: 'Jordan Lee',
      avatar: 'https://i.pravatar.cc/150?img=32'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
  },
  {
    companyName: 'Leaf & Stone',
    contactPersonName: 'Emily Parker',
    businessType: 'Home Decor Store',
    socialMedia: 'leafandstone.com',
    email: 'support@leafandstone.com',
    fullName: 'Emily Parker',
    progress: 'In Progress',
    handledBy: {
      name: 'Emma Chen',
      avatar: 'https://i.pravatar.cc/150?img=5'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()
  },
  {
    companyName: 'SwiftCart',
    contactPersonName: 'James Wilson',
    businessType: 'E-commerce Startup',
    socialMedia: 'swiftcart.io',
    email: 'info@swiftcart.io',
    fullName: 'James Wilson',
    progress: 'Closed',
    handledBy: {
      name: 'Alex Kim',
      avatar: 'https://i.pravatar.cc/150?img=11'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString()
  },
  {
    companyName: 'NestWell Realty',
    contactPersonName: 'Casey Morgan',
    businessType: 'Real Estate Agency',
    socialMedia: 'nestwellrealty.com',
    email: 'sales@nestwellrealty.com',
    fullName: 'Casey Morgan',
    progress: 'Closed',
    handledBy: {
      name: 'Jordan Lee',
      avatar: 'https://i.pravatar.cc/150?img=32'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString()
  }
];

export const defaultData = {
  users: defaultUsers,
  tasks: defaultTasks,
  notifications: defaultNotifications,
  events: defaultEvents,
  leads: defaultLeads
};
