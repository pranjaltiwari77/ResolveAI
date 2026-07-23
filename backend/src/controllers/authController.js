const User = require('../models/User');
const Organization = require('../models/Organization');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('../utils/mailer');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Get the primary organization created (first one)
    let primaryOrg = await Organization.findOne().sort({ createdAt: 1 });
    if (!primaryOrg) {
      primaryOrg = new Organization({
        name: 'Primary Workspace',
        slug: 'primary-workspace',
      });
      await primaryOrg.save();
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user as a customer of the primary org (unverified)
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'customer',
      organizationId: primaryOrg._id,
      isVerified: false,
      verificationOtp: otp,
      otpExpiry,
    });
    await newUser.save();

    // Send email (async)
    sendVerificationEmail(email, otp);

    res.status(201).json({ message: 'Registration successful. Please verify your email.', requiresVerification: true, email });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified && user.role === 'customer') {
      return res.status(401).json({ message: 'Email not verified. Please check your inbox for the OTP.', requiresVerification: true, email: user.email });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role, organizationId: user.organizationId },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    if (user.verificationOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Verify user and clear OTP
    user.isVerified = true;
    user.verificationOtp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Generate JWT for immediate login
    const token = jwt.sign(
      { userId: user._id, role: user.role, organizationId: user.organizationId },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ 
      message: 'Email verified successfully', 
      token, 
      user: { id: user._id, name: user.name, role: user.role } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
};
