import Counter from '../models/Counter.js';
import Conversation from '../models/Conversation.js';

export const GetDisplayMessage = async () => {
    try {
        const displayMessage = await Counter.findOneAndUpdate({ name: 'MessageId' }, { $inc: countID });
        return displayMessage.countID + 1;
    } catch (err) {
        if (err) return false;
    }
};

export const ConvertToObject = (string) => {
    let stringObject = string.replace(/{|}|"/g, '');
    let obj = {};
    let stringKeyValueArr = stringObject.split(',');
    for (let i = 0; i < stringKeyValueArr.length; i++) {
        obj[`${stringKeyValueArr[i].split(':')[0]}`] = `${stringKeyValueArr[i]
            .slice(stringKeyValueArr[i].split(':')[0].length + 1, stringKeyValueArr[i].length)
            .trim()}`;
    }
    return obj;
};
export const ConvertToObjectQuote = (string) => {
    let stringObject = string.replace(/{|}|"/g, '');

    let obj = {};
    let stringKeyValueArr = stringObject.split(',');
    console.log(stringKeyValueArr);

    for (let i = 4; i < stringKeyValueArr.length - 2; i++) {
        stringKeyValueArr[4] = stringKeyValueArr[4] + ',' + stringKeyValueArr[i + 1];
    }
    for (let i = 4; i < stringKeyValueArr.length - 2; i++) {
        stringKeyValueArr.splice(i + 1, 1);
    }

    for (let i = 0; i < stringKeyValueArr.length; i++) {
        obj[`${stringKeyValueArr[i].split(':')[0]}`] = `${stringKeyValueArr[i]
            .slice(stringKeyValueArr[i].split(':')[0].length + 1, stringKeyValueArr[i].length)
            .trim()}`;
    }
    return obj;
};
export const ConvertToArrayObject = (string) => {
    let stringObject = string.replace(']', '').replace('[', '');
    let stringArrayObject = stringObject.split('},{');
    let arrayObject = [];
    for (let i = 0; i < stringArrayObject.length; i++) {
        arrayObject.push(ConvertToObject(stringArrayObject[i]));
    }
    return arrayObject;
};
export const MarkUnreaderMessage = (ConversationID, SenderID, listMember) => {
    let listCheck = listMember.filter((e) => Number(e) != Number(SenderID));
    Conversation.updateOne(
        {
            _id: Number(ConversationID),
            'memberList.memberId': { $in: listCheck },
        },
        {
            $set: { 'memberList.$[elem].unReader': 1 },
        },
        {
            multi: true,
            arrayFilters: [{ 'elem.memberId': { $in: listCheck } }],
        }
    ).catch(function (err) {
        console.log(err);
    });
    Conversation.updateOne(
        {
            _id: Number(ConversationID),
            'memberList.memberId': Number(SenderID),
        },
        {
            $set: { 'memberList.$.timeLastSeener': new Date() },
        }
    ).catch(function (err) {
        console.log(err);
    });

    // lay id tin nhan cuoi cung cua cuoc tro chuyen ConversationID
    // cap nhat lastMessageSeen
};

export const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
};

export const localfile = (IdDevice, pathFile) => {
    return {
        IdDevice: IdDevice,
        pathFile: pathFile,
    };
};

export const checkPhoneNumberInMessage = (message) => {
    let regex = /\d{10}/; // Biểu thức chính quy để tìm kiếm chuỗi có 10 chữ số liên tiếp
    let match = regex.exec(message);
    if (match) {
        return match[0];
    } else {
        return null;
    }
};

export const getAdsImg = (userId, imgName) => {
    if (imgName) return `http://210.245.108.202:9002/adsImage/${userId}/${imgName}`;
};
