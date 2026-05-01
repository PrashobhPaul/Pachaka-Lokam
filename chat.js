class ChatManager {
    constructor() {
        this.chats = [];
        this.messages = [];
        this.groups = [];
    }

    createDirectChat(userId1, userId2) {
        const chatId = `chat_${userId1}_${userId2}_${Date.now()}`;
        const chat = {
            id: chatId,
            type: 'direct',
            participants: [userId1, userId2],
            createdAt: new Date()
        };
        this.chats.push(chat);
        console.log(`Direct chat created between ${userId1} and ${userId2}`);
        return chat;
    }

    sendMessage(chatId, senderId, text) {
        const message = {
            id: `msg_${Date.now()}`,
            chatId,
            senderId,
            text,
            timestamp: new Date(),
            read: false
        };
        this.messages.push(message);
        console.log(`Message sent in chat ${chatId}: ${text}`);
        return message;
    }

    getMessages(chatId) {
        return this.messages.filter(msg => msg.chatId === chatId);
    }

    markMessagesAsRead(chatId, userId) {
        this.messages.forEach(msg => {
            if (msg.chatId === chatId && msg.senderId !== userId) {
                msg.read = true;
            }
        });
    }

    createGroupChat(groupName, members) {
        const groupId = `group_${Date.now()}`;
        const group = {
            id: groupId,
            name: groupName,
            members,
            createdAt: new Date()
        };
        this.groups.push(group);
        console.log(`Group chat '${groupName}' created with ${members.length} members`);
        return group;
    }

    addMemberToGroup(groupId, userId) {
        const group = this.groups.find(g => g.id === groupId);
        if (group && !group.members.includes(userId)) {
            group.members.push(userId);
            console.log(`User ${userId} added to group ${groupId}`);
        }
    }

    removeMemberFromGroup(groupId, userId) {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            group.members = group.members.filter(id => id !== userId);
            console.log(`User ${userId} removed from group ${groupId}`);
        }
    }

    getGroupMessages(groupId) {
        return this.messages.filter(msg => msg.groupId === groupId);
    }

    shareRecipeInGroup(groupId, senderId, recipeName, recipeDetails) {
        const message = {
            id: `msg_${Date.now()}`,
            groupId,
            senderId,
            type: 'recipe',
            recipeName,
            recipeDetails,
            timestamp: new Date(),
            read: false
        };
        this.messages.push(message);
        console.log(`Recipe '${recipeName}' shared in group ${groupId}`);
        return message;
    }

    getUserChats(userId) {
        return this.chats.filter(chat => chat.participants.includes(userId));
    }

    getUserGroups(userId) {
        return this.groups.filter(group => group.members.includes(userId));
    }
}

module.exports = ChatManager;