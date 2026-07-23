const User = require('../models/User');
const Organization = require('../models/Organization');
const bcrypt = require('bcrypt');
const emailService = require('../services/emailService');

// ─── PROFILE ───────────────────────────────────────────────

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password -refreshTokens');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to change password' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    const { password, refreshTokens, ...safeUser } = user.toObject();
    res.status(200).json(safeUser);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

// ─── TEAM MANAGEMENT (Admin only) ─────────────────────────

exports.getTeamMembers = async (req, res) => {
  try {
    const members = await User.find({
      organizationId: req.user.organizationId,
      isActive: true,
      role: { $in: ['admin', 'support_agent'] },
    }).select('-password -refreshTokens').sort({ createdAt: -1 });
    res.status(200).json(members);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch team members', error: error.message });
  }
};

exports.inviteMember = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ message: 'Name, email, and role are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    // Use a temporary password; in production, send an invite email
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'support_agent',
      organizationId: req.user.organizationId,
    });

    const { password, refreshTokens, ...safeUser } = newUser.toObject();

    // Fetch org name for the email
    const org = await Organization.findById(req.user.organizationId);
    const orgName = org ? org.name : 'your organization';

    // Send email
    emailService.sendInviteEmail(email, name, tempPassword, orgName).catch(err => console.error(err));

    res.status(201).json({
      ...safeUser,
      tempPassword, // Return temp password so admin can share it
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to invite member', error: error.message });
  }
};

exports.updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowed = ['admin', 'support_agent', 'customer'];
    if (!allowed.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Prevent admin from demoting themselves
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      { role },
      { new: true }
    ).select('-password -refreshTokens');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update role', error: error.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ message: 'Cannot remove yourself' });
    }

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      { isActive: false },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove member', error: error.message });
  }
};

// ─── ORGANIZATION SETTINGS ─────────────────────────────────

exports.getOrgSettings = async (req, res) => {
  try {
    const org = await Organization.findById(req.user.organizationId);
    if (!org) return res.status(404).json({ message: 'Organization not found' });
    res.status(200).json(org);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch org settings', error: error.message });
  }
};

exports.updateOrgSettings = async (req, res) => {
  try {
    const { name } = req.body;
    const org = await Organization.findByIdAndUpdate(
      req.user.organizationId,
      { $set: { name } },
      { new: true }
    );
    if (!org) return res.status(404).json({ message: 'Organization not found' });
    res.status(200).json(org);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update org settings', error: error.message });
  }
};
