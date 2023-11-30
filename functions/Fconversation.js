import Conversation from "../models/Conversation.js";
import Counter from "../models/Counter.js";
export const FCreateNewConversation = async(UserID, SenderID) => {
    try {
        const userId = Number(UserID);
        const contactId = Number(SenderID);
        // console.log("Input",userId,contactId)
        const data = {
            result: true,
        };
        const bigestId = (
            await Conversation.find().sort({ _id: -1 }).select("_id").limit(1)
        )[0]._id;
        // console.log("bigest",bigestId)
        const existConversation = await Conversation.findOne({
            $and: [
                { "memberList.memberId": { $eq: userId } },
                { "memberList.memberId": { $eq: contactId } },
            ],
            memberList: { $size: 2 },
            isGroup: 0,
        });
        if (existConversation) {
            data["conversationId"] = existConversation._id;
            return existConversation._id
        }
        let user_Favorite = 0
        let contact_Favorite = 0
        if (userId === 1216972) {
            contact_Favorite = 1
        }
        if (contactId === 1216972) {
            user_Favorite = 1
        }
        const newConversation = await Conversation.create({
            _id: bigestId + 1,
            isGroup: 0,
            typeGroup: "Normal",
            memberList: [{
                    memberId: userId,
                    notification: 1,
                    isFavorite: user_Favorite
                },
                {
                    memberId: contactId,
                    notification: 1,
                    isFavorite: contact_Favorite
                },
            ],
            messageList: [],
            browseMemberList: [],
        });
        data["conversationId"] = newConversation._id;
        await Counter.findOneAndUpdate({ name: "ConversationID" }, { countID: newConversation._id })
        return newConversation._id;
    } catch (err) {
        console.log(err)
        return false;
    }
};