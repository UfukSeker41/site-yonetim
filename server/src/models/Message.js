// Message Model - Sequelize
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Message = sequelize.define('messages', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  meetingId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'meeting_id',
    references: {
      model: 'meetings',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  messageType: {
    type: DataTypes.ENUM('text', 'system', 'file'),
    defaultValue: 'text',
    field: 'message_type'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read'
  }
}, {
  tableName: 'messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['meeting_id'] },
    { fields: ['created_at'] }
  ]
});

export default Message;
