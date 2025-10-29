// Meeting Model - Sequelize
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Meeting = sequelize.define('meetings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  meetingType: {
    type: DataTypes.ENUM('video', 'chat'),
    defaultValue: 'chat',
    allowNull: false,
    field: 'meeting_type'
  },
  roomId: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false,
    field: 'room_id'
  },
  hostId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'host_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'ongoing', 'completed', 'cancelled'),
    defaultValue: 'scheduled'
  },
  scheduledAt: {
    type: DataTypes.DATE,
    field: 'scheduled_at'
  },
  startedAt: {
    type: DataTypes.DATE,
    field: 'started_at'
  },
  endedAt: {
    type: DataTypes.DATE,
    field: 'ended_at'
  },
  maxParticipants: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    field: 'max_participants'
  }
}, {
  tableName: 'meetings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['room_id'] },
    { fields: ['status'] },
    { fields: ['scheduled_at'] }
  ]
});

export default Meeting;
