// Announcement Model - Sequelize
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Announcement = sequelize.define('announcements', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'author_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  category: {
    type: DataTypes.STRING(100)
  },
  expiresAt: {
    type: DataTypes.DATE,
    field: 'expires_at'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'view_count'
  }
}, {
  tableName: 'announcements',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['created_at'] },
    { fields: ['priority'] },
    { fields: ['author_id'] }
  ]
});

export default Announcement;
