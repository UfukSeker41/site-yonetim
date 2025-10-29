// Model Associations - İlişkileri tanımla
import User from './User.js';
import Announcement from './Announcement.js';
import Meeting from './Meeting.js';
import Message from './Message.js';

// User - Announcement ilişkisi
User.hasMany(Announcement, {
  foreignKey: 'authorId',
  as: 'announcements'
});
Announcement.belongsTo(User, {
  foreignKey: 'authorId',
  as: 'author'
});

// User - Meeting ilişkisi (host)
User.hasMany(Meeting, {
  foreignKey: 'hostId',
  as: 'hostedMeetings'
});
Meeting.belongsTo(User, {
  foreignKey: 'hostId',
  as: 'host'
});

// Meeting - Message ilişkisi
Meeting.hasMany(Message, {
  foreignKey: 'meetingId',
  as: 'messages'
});
Message.belongsTo(Meeting, {
  foreignKey: 'meetingId',
  as: 'meeting'
});

// User - Message ilişkisi
User.hasMany(Message, {
  foreignKey: 'userId',
  as: 'messages'
});
Message.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

export { User, Announcement, Meeting, Message };
