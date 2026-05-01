// friends.js

class FriendManager {
    constructor() {
        this.friendRequests = [];
        this.friends = [];
    }

    // Function to send a friend request
    sendFriendRequest(userId) {
        if (!this.friendRequests.includes(userId)) {
            this.friendRequests.push(userId);
            console.log(`Friend request sent to ${userId}`);
        } else {
            console.log(`Friend request to ${userId} already exists.`);
        }
    }

    // Function to accept a friend request
    acceptFriendRequest(userId) {
        const index = this.friendRequests.indexOf(userId);
        if (index !== -1) {
            this.friendRequests.splice(index, 1);
            this.friends.push(userId);
            console.log(`Friend request from ${userId} accepted.`);
        } else {
            console.log(`No friend request from ${userId} found.`);
        }
    }

    // Function to reject a friend request
    rejectFriendRequest(userId) {
        const index = this.friendRequests.indexOf(userId);
        if (index !== -1) {
            this.friendRequests.splice(index, 1);
            console.log(`Friend request from ${userId} rejected.`);
        } else {
            console.log(`No friend request from ${userId} found.`);
        }
    }

    // Function to discover friends (mock implementation)
    discoverFriends(users) {
        const availableUsers = users.filter(user => !this.friends.includes(user));
        console.log(`Available users for friendship: ${availableUsers.join(', ')}`);
        return availableUsers;
    }

    // Function to get the list of friends
    getFriends() {
        return this.friends;
    }
}

// Exporting the FriendManager class
module.exports = FriendManager;