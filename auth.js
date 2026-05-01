// auth.js

const users = [];

// function to register a new user
function register(username, password) {
    // Check if user already exists
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
        throw new Error('User already exists');
    }
    // Create a new user
    const newUser = { username, password, profile: {} };
    users.push(newUser);
    return newUser;
}

// function to authenticate an existing user
function authenticate(username, password) {
    const user = users.find(user => user.username === username);
    if (!user || user.password !== password) {
        throw new Error('Invalid credentials');
    }
    return user;
}

// function to update user profile
function updateProfile(username, profileData) {
    const user = users.find(user => user.username === username);
    if (!user) {
        throw new Error('User not found');
    }
    user.profile = { ...user.profile, ...profileData };
    return user.profile;
}

// Export functions for external use
module.exports = { register, authenticate, updateProfile };