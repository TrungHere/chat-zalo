import UserZalo from '../models/UserZalo.js';
import Token from '../models/TokenZalo.js';

export const createUserZalo = async (req, res) => {
    try {
        const user_id = req.body.user_id
        const oa_id = req.body.oa_id
        const app_id = req.body.app_id 
        const userName = req.body.userName 
        const avatar = req.body.avatar
        if(!user_id && !userName){// validate dữ liệu
           return res.status(409).send(createError(409, "Thiếu trường truyền lên"));
        }
        // ltra tồn tại
        const check = await UserZalo.findOne({ user_id: user_id , oa_id: oa_id }).lean();
        if(!check){// thêm mới nếu không tồn tại
            let max = await UserZalo.findOne({},{_id :1}).sort({_id : -1}).lean() || 0
            const insert = new UserZalo({
                _id : Number(max._id) + 1 || 1,
                user_id : user_id,
                userID365 : user_id,
                userName : userName,
                avatar : avatar,
                oa_id : oa_id,
                app_id : app_id,
            })
            await insert.save()
            return res.status(200).send({ code: 200, message : "luu thành công", error: null });
        }
        // cập nhật dự liệu ava và tên nếu có thay đổi
        await UserZalo.updateOne({ user_id: user_id , oa_id: oa_id },{
            userName : userName,
            avatar : avatar,
        });
        return res.status(200).send(createError(200, "tài khoản đã tồn tại"));
    } catch (err) {
        console.log(err);
        if (err) return res.status(200).send(createError(200, err.mesesage));
    }
};

export const saveConversationZalo = async (req, res) => {
    try {
        const from_id = req.body.from_id
        const to_id = req.body.to_id
        const senderId = req.body.senderId
        const memList = req.body.memberList ? JSON.parse(req.body.memberList) : null;
        let conversationName = req.body.conversationName;
        const memberApproval = req.body.memberApproval ? Number(req.body.memberApproval) : 1;
        let listName = []//xử lý tên người dùng cho tên nhóm
        if(memList){
            const below100B = memList.filter(e => e < 100000000000);
            const above100B = memList.filter(e => e > 100000000000);
            const listNameUser = await Users.find({ _id: below100B }).select('userName -_id').lean();
            const listNameZalo = await UserZalo.find({ user_id: above100B }).select('userName -_id').lean();
            listName = listName.concat(listNameUser, listNameZalo);
        }

        const existConversation = await Conversation.findOne({
            $and: [{ 'memberList.memberId': { $eq: from_id } }, { 'memberList.memberId': { $eq: to_id } }],
            memberList: { $size: 2 },
            isGroup: 0,
        }).lean();
        const data = {
            result: true,
        };
            if (existConversation) {
                // Cuộc trò chuyện đã tồn tại
                Conversation.updateOne({ _id: existConversation._id }, { $set: { timeLastChange: new Date() } }).catch(
                    (e) => {
                        console.log('CreateNewConversation error', e);
                    }
                );
                data['conversationId'] = existConversation._id;
                return res.send({ data, error: null });

            } else {
                // Cuộc trò chuyện chưa tồn tại

                let result = await Conversation.findOne({}, { _id: 1 })
                .sort({ _id: -1 })
                .lean() || 0

                if(!senderId && !memList ){ //Cuộc trò chuyện 1-1 
                    const newConversation = await Conversation.create({
                        _id: Number(result._id) + 1 || 1,
                        isGroup: 0,
                        typeGroup: `Zalo`,
                        memberList: [{
                            memberId: from_id,
                            notification: 1,
                            isFavorite: 0,
                        },
                        {
                            memberId: to_id,
                            notification: 1,
                            isFavorite: 0,
                        },
                        ],
                        messageList: [],
                        browseMemberList: [],
                    });
                    data['conversationId'] = newConversation._id;
                    await Counter.findOneAndUpdate({ name: 'ConversationID' }, { countID: newConversation._id });
                    return res.send({ data, error: null });

                }else{//Cuộc trò chuyện nhiều người

                    //xử lí tên cuộc trò chuyện 
                    const check = await CheckDefautNameGroupOneMember(Number(memList[0]), conversationName);
                    if (check) {
                        return res.status(400).send(createError(400, 'Chọn một tên nhóm khác'));
                    }
                    if (!conversationName && listName.length === 1) {
                        conversationName = 'Chỉ mình tôi';
                    }
                    if (!conversationName && listName.length === 2) {
                        conversationName = listName.map((e) => (e = e.userName)).join(', ');
                    }
                    if (!conversationName && !(listName.length < 3)) {
                        conversationName = listName
                            .map((e) => (e = e.userName))
                            .slice(-3)
                            .join(', ');
                    }
                    const memberList = memList.map((e) => {
                        return (e = {
                            memberId: e,
                            conversationName: conversationName,
                            notification: 1,
                        });
                    });
                    const messageList = [];
    
                  
                        //update bảng counter
                        let update = await Counter.updateOne({ 
                            name: 'ConversationID' 
                        }, { 
                            $set: 
                            { countID: Number(result._id) + 1 || 1} 
                        });
                            const newConversation = new Conversation({
                                _id: Number(result._id) + 1 || 1,
                                isGroup: 1,
                                typeGroup: `Zalo`,
                                avatarConversation: '',
                                adminId: "",
                                shareGroupFromLinkOption: 1,
                                browseMemberOption: 1,
                                pinMessage: '',
                                memberList,
                                messageList,
                                browseMemberList: [],
                                timeLastMessage: new Date(),
                                memberApproval,
                            });
                            await newConversation.save();
                            const objectNewCon = newConversation.toObject();
                            
                            objectNewCon['conversationId'] = objectNewCon._id;
                            objectNewCon.memberList = 0;
                            objectNewCon.messageList = 0;
                            data['message'] =  'Tạo nhóm thành công';
                            data['conversation_info'] = objectNewCon;
                            // for (const mem of memberList) {
                            //     let mess;
                            //     if (mem.memberId === senderId) {
                            //         mess = `${senderId} joined this consersation`;
                            //     }
                            //     if (mem.memberId !== senderId) {
                            //         mess = `${senderId} added ${mem.memberId} to this consersation`;
                            //     }
                    
                            //     let result = await axios({
                            //         method: 'post',
                            //         url: 'http://210.245.108.202:9000/api/message/SendMessage',
                            //         data: {
                            //             dev: 'dev',
                            //             MessageID: '',
                            //             ConversationID: objectNewCon._id,
                            //             SenderID: senderId,
                            //             MessageType: 'notification',
                            //             Message: mess,
                            //             Emotion: '',
                            //             Quote: '',
                            //             Profile: '',
                            //             ListTag: '',
                            //             File: '',
                            //             ListMember: '',
                            //             IsOnline: [],
                            //             IsGroup: 1,
                            //             ConversationName: '',
                            //             DeleteTime: 0,
                            //             DeleteType: 0,
                            //         },
                            //         headers: { 'Content-Type': 'multipart/form-data' },
                            //     });
                            // }
                            return res.send({ data, error: null });
                }
                }
            
    } catch (err) {
        console.log(err);
        if (err) return res.status(200).send(createError(200, err.mesesage));
    }
};

export const GetConversation_zalo = async (req, res) => {
    try {
        let userId = Number(req.body.userId);
        let companyId = req.body.companyId ? Number(req.body.companyId) : 0;
        let countConversation = Number(req.body.countConversation);
        let countConversationLoad = Number(req.body.countConversationLoad);
        if (countConversationLoad > countConversation || countConversationLoad == countConversation) {
            data['listCoversation'] = [];
            return res.send({ data, error: null });
        }
        if (req.body.token) {
            let check = await checkToken(req.body.token);
            if (check && check.status && check.userId == req.body.senderId) {
                console.log('Token hop le, GetConversation');
            } else {
                return res.status(404).json(createError(404, 'Invalid token'));
            }
        }
        const [listConvStrange, lastConvStrange] = [
            [], 0
        ];
        listConvStrange.splice(listConvStrange.indexOf(lastConvStrange), 1);
        const senderId = Number(req.body.senderId);
        console.time('getConver Zalo preproc');
        console.log(userId);
        console.log(listConvStrange);
        let  listCons = await Conversation.aggregate([{
            $match: {
                $and: [{ 'memberList.memberId': userId }, { _id: { $nin: listConvStrange } }],
            },
        },
        {
            $match: {
                'messageList.0': {
                    $exists: true,
                },
                listDeleteMessageOneSite: { $ne: userId },
                typeGroup: "Zalo",//zalo edit here
            },
        },
        {
            $sort: {
                timeLastMessage: -1,
            },
        },
        {
            $skip: countConversationLoad,
        },
        {
            $limit: 20,
        },
        // {
        //     $lookup: {
        //         from: 'Users',
        //         localField: 'browseMemberList.memberBrowserId',
        //         foreignField: '_id',
        //         as: 'listBrowse',
        //     },
        // },
        {
            $lookup: {
                from: 'Users_Zalo',
                localField: 'memberList.memberId',
                foreignField: 'userID365',
                as: 'listMenZalo',//list user zalo ,zalo edit here
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'memberList.memberId',
                foreignField: '_id',
                as: 'listMember',
            },
        },
        {
            $lookup: {
                from: 'Users',
                localField: 'userCreate',
                foreignField: '_id',
                as: 'user',
            },
        },
        {
            $unwind: {
                path: '$user',
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $project: {
                _id: 0,
                conversationId: '$_id',
                isGroup: 1,
                typeGroup: 1,
                avatarConversation: 1,
                linkAvatar: '$avatarConversation',
                adminId: 1,
                deputyAdminId: { $ifNull: ['$deputyAdminId', []] },
                userCreate: { $ifNull: ['$userCreate', 0] },
                userNameCreate: { $ifNull: ['$user.userName', ''] },
                shareGroupFromLinkOption: 1,
                browseMemberOption: 1,
                browseMemberList: 1,
                listBrowse: 1,
                pinMessage: 1,
                memberList: 1,
                listMember: 1,
                listMenZalo: 1,//list user zalo ,zalo edit here
                messageList: 1,
                listBrowse: 1,
                timeLastMessage: 1,
                timeLastChange: 1,
                liveChat: 1,
                fromWeb: 1,
                lastMess: {
                    $reduce: {
                        input: {
                            $reverseArray: '$messageList',
                        },
                        initialValue: null,
                        in: {
                            $cond: {
                                if: {
                                    $and: [{
                                        $eq: [{
                                            $indexOfArray: ['$$this.listDeleteUser', userId],
                                        }, -1,],
                                    },
                                    {
                                        $eq: [{
                                            $indexOfArray: ['$lastMess.listDeleteUser', userId],
                                        }, -1,],
                                    },
                                    ],
                                },
                                then: '$$this',
                                else: {
                                    $cond: {
                                        if: {
                                            $eq: [{
                                                $indexOfArray: ['$$value.listDeleteUser', userId],
                                            }, -1,],
                                        },
                                        then: '$$value',
                                        else: '$$this',
                                    },
                                },
                            },
                        },
                    },
                },
                sender: {// lấy ra người gửi 
                    $filter: {
                        input: '$memberList',
                        as: 'mem',
                        cond: {
                            $eq: ['$$mem.memberId', userId],
                        },
                    },
                },
                countMessage: {
                    $size: '$messageList',
                },
            },
        },
        {
            $unwind: {
                path: '$sender',
            },
        },
        {//project lần 2 lại trường cần lấy
            $project: {
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                adminId: 1,
                deputyAdminId: 1,
                userCreate: 1,
                userNameCreate: 1,
                browseMember: '$browseMemberOption',
                pinMessageId: '$pinMessage',
                memberList: 1,
                messageList: 1,
                listMember: 1,
                listMenZalo: 1,//list user zalo ,zalo edit here
                listBrowse: 1,
                browseMemberList: 1,
                timeLastMessage: 1,
                timeLastChange: 1,
                liveChat: 1,
                fromWeb: 1,
                messageId: '$lastMess._id',
                countMessage: 1,
                unReader: '$sender.unReader',
                message: '$lastMess.message',
                messageType: '$lastMess.messageType',
                createAt: '$lastMess.createAt',
                messageDisplay: '$sender.messageDisplay',
                senderId: '$lastMess.senderId',
                shareGroupFromLink: '$shareGroupFromLinkOption',
                isFavorite: '$sender.isFavorite',
                notification: '$sender.notification',
                isHidden: '$sender.isHidden',
                deleteTime: '$sender.deleteTime',
                deleteType: '$sender.deleteType',
                timeLastSeener: '$sender.timeLastSeener',
            },
        },
        {// né cuộc trò chuyện yêu thích
            $match: {
                memberList: {
                    $elemMatch: {
                        memberId: userId,
                        isFavorite: {
                            $ne: 1,
                        },
                    },
                },
            },
        },
        {
            $lookup: {
                from: 'Privacys',
                localField: 'memberList.memberId',
                foreignField: 'userId',
                as: 'privacy',
            },
        },
        {
            $project: {
                conversationId: 1,
                isGroup: 1,
                typeGroup: 1,
                adminId: 1,
                deputyAdminId: 1,
                avatarConversation: 1,
                linkAvatar: 1,
                shareGroupFromLink: 1,
                browseMember: 1,
                pinMessageId: 1,
                memberList: {
                    $map: {
                        input: '$memberList',
                        as: 'member',
                        in: {
                            memberId: '$$member.memberId',
                            conversationName: '$$member.conversationName',
                            unReader: '$$member.unReader',
                            messageDisplay: '$$member.messageDisplay',
                            isHidden: '$$member.isHidden',
                            isFavorite: '$$member.isFavorite',
                            notification: '$$member.notification',
                            timeLastSeener: '$$member.timeLastSeener',
                            lastMessageSeen: '$$member.lastMessageSeen',
                            deleteTime: '$$member.deleteTime',
                            deleteType: '$$member.deleteType',
                            favoriteMessage: '$$member.favoriteMessage',
                            liveChat: '$$member.liveChat',
                            fromWeb: '$$member.fromWeb',
                            seenMessage: {
                                $let: {
                                    vars: {
                                        privacyObj: {
                                            $arrayElemAt: [{
                                                $filter: {
                                                    input: '$privacy',
                                                    cond: {
                                                        $eq: ['$$this.userId', '$$member.memberId'],
                                                    },
                                                },
                                            },
                                                0,
                                            ],
                                        },
                                    },
                                    in: {
                                        $ifNull: ['$$privacyObj.seenMessage', 1],
                                    },
                                },
                            },
                            statusOnline: {
                                $let: {
                                    vars: {
                                        privacyObj: {
                                            $arrayElemAt: [{
                                                $filter: {
                                                    input: '$privacy',
                                                    cond: {
                                                        $eq: ['$$this.userId', '$$member.memberId'],
                                                    },
                                                },
                                            },
                                                0,
                                            ],
                                        },
                                    },
                                    in: {
                                        $ifNull: ['$$privacyObj.statusOnline', 1],
                                    },
                                },
                            },
                        },
                    },
                },

                browseMemberList: 1,
                timeLastMessage: {
                    $dateToString: {
                        date: '$timeLastMessage',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                timeLastChange: 1,
                liveChat: 1,
                fromWeb: 1,
                message: 1,
                unReader: 1,
                messageType: 1,
                createAt: {
                    $dateToString: {
                        date: '$createAt',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                messageDisplay: 1,
                messageId: 1,
                isFavorite: 1,
                senderId: 1,
                notification: 1,
                isHidden: 1,
                countMessage: 1,
                deleteTime: 1,
                deleteType: 1,
                timeLastSeener: {
                    $dateToString: {
                        date: '$timeLastSeener',
                        timezone: '+07:00',
                        format: '%G-%m-%dT%H:%M:%S.%L+07:00',
                    },
                },
                listMember: {
                    $map: {
                        input: '$listMember',
                        as: 'member',
                        in: {
                            _id: '$$member._id',
                            id365: '$$member.idQLC',
                            type365: '$$member.type',
                            email: { $ifNull: ['$$member.email', '$$member.phoneTk'] },
                            password: '$$member.password',
                            phone: '$$member.phone',
                            userName: '$$member.userName',
                            avatarUser: '$$member.avatarUser',
                            linkAvatar: '',
                            status: '$$member.status',
                            statusEmotion: '$$member.configChat.statusEmotion',
                            lastActive: '$$member.lastActivedAt',
                            active: '$$member.active',
                            isOnline: '$$member.isOnline',
                            companyId: { $ifNull: ['$$member.inForPerson.employee.com_id', '$$member.idQLC'] },
                            idTimViec: '$$member.idTimViec365',
                            fromWeb: '$$member.fromWeb',
                            createdAt: '$$member.createdAt',
                        },
                    },
                },
                listMenZalo: {//list user zalo ,zalo edit here
                    $map: {
                        input: '$listMenZalo',
                        as: 'member',
                        in: {
                            _id: '$$member.userID365',
                            UserZalo_id: '$$member.user_id',
                            email: { $ifNull: ['$$member.Email', '$$member.Phone'] },
                            phone: '$$member.Phone',
                            userName: '$$member.userName',
                            avatarUser: '$$member.avatar',
                            Address: '$$member.Address',
                            oa_id: '$$member.oa_id',
                            Note: '$$member.Note',
                            createdAt: '$$member.Create_at',
                        },
                    },
                },
                // listBrowse: {
                //     $map: {
                //         input: '$listBrowse',
                //         as: 'browse',
                //         in: {
                //             _id: '$$browse._id',
                //             userName: '$$browse.userName',
                //             avatarUser: '$$browse.avatarUser',
                //             linkAvatar: '',
                //             status: '$$browse.status',
                //             statusEmotion: '$$browse.configChat.statusEmotion',
                //             lastActive: '$$browse.lastActivedAt',
                //             active: '$$browse.active',
                //             isOnline: '$$browse.isOnline',
                //         },
                //     },
                // },
            },
        },
        {
            $sort: {
                timeLastMessage: -1,
            },
        },
        ]);
  
        const data = {
            result: true,
            message: 'Lấy thông tin cuộc trò chuyện thành công',
        };
        // console.log(listCons)
        console.timeEnd('getConver Zalo preproc');
        // return res.status(200).send({ listCons, error: null });

        if (!listCons.length) {
            return res.send(createError(200, 'Cuộc trò chuyện không tồn tại'));
        }
     
        for (let [index, con] of listCons.entries()) {
            const { memberList, listMember, listMenZalo } = con;
            let newDataMember = listMember.map((e) => {
                e['id'] = e._id;
         
                const user = memberList.find((mem) => mem.memberId === e._id);
                e.avatarUserSmall = GetAvatarUserSmall(e._id, e.userName, e.avatarUser);
                e.avatarUser = GetAvatarUser(e._id, e.type365, e.fromWeb, e.createdAt, e.userName, e.avatarUser);
                // e.avatarUser = e.avatarUser
                //   ? `https://ht.timviec365.vn:9002/avatarUser/${e._id}/${e.avatarUser}`
                //   : `https://ht.timviec365.vn:9002/avatar/${e.userName
                //     .substring(0, 1)
                //     .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
                // let relationShip = contact.find((e) => {
                //     if (e.userFist == userId && e.userSecond == user.memberId) {
                //         return true;
                //     }
                //     if (e.userSecond == userId && e.userFist == user.memberId) {
                //         return true;
                //     }
                // });
                // e['friendStatus'] = relationShip ? 'friend' : 'none'; //zalo không có trạng thái bạn bè
                e.linkAvatar = e.avatarUser;
                e.lastActive = date.format(e.lastActive || new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
                if (user && user.timeLastSeener) {
                    e.timeLastSeenerApp = `${JSON.parse(
                        JSON.stringify(
                            new Date(
                                new Date(user.timeLastSeener).setHours(new Date(user.timeLastSeener).getHours() + 7)
                            )
                        )
                    ).replace('Z', '')}+07:00`;
                }
                return (e = { ...e, ...user });
            });
            //list user zalo ,zalo edit here
            let newDataMemberZalo = listMenZalo.map((e) => {
                e['id'] = e._id;
                return e;
            });
            //list user zalo ,zalo edit here
            // Gộp cả 2 mảng newDataMember và newDataMemberZalo
            let combinedNewDataMember = newDataMember.concat(newDataMemberZalo);
            // lấy ra người dùng khác với người gửi 
            const users = combinedNewDataMember.filter((mem) => mem._id !== userId);
            // lấy ra người dùng trùng với ngời gửi 
            const owner = combinedNewDataMember.filter((mem) => mem._id === userId);
            console.log(owner)
            let conversationName = owner[0]?.conversationName || owner[0]?.userName;
            let avatarConversation;
            // check xem là group để xử lý tên
            if (!listCons[index].isGroup) {

                if (!users[0]) {
                    conversationName = owner[0].userName;
                } else {
                    conversationName = owner[0].conversationName || users[0].userName;
                }
                avatarConversation = users[0] ? users[0].avatarUser : owner[0].avatarUser;
            }
            if (listCons[index].isGroup && listMember.length === 2) {
                conversationName =
                    users[0] && users[0].conversationName != '' ? users[0].conversationName : users[0].userName;
            }
            if (listCons[index].isGroup && listMember.length === 3) {
                conversationName =
                    owner[0].conversationName != '' ?
                        owner[0].conversationName :
                        users
                            .map((e) => (e = e.userName))
                            .slice(-2)
                            .join(',');
            }
            if (listCons[index].isGroup && listMember.length > 3) {
                conversationName =
                    owner[0].conversationName != '' ?
                        owner[0].conversationName :
                        users
                            .map((e) => (e = e.userName))
                            .slice(-3)
                            .join(',');
            }
            //xử lý tin nhắn từ người lạ
            if (listCons[index].conversationId == lastConvStrange) {
                listCons[index].conversationId = 0;
                listCons[index].message = `Bạn có tin nhắn từ ${listConvStrange.length + 1} người lạ`;
            }
            //Xử lý avatar nhóm
            if (listCons[index].isGroup && listCons[index].avatarConversation) {
                avatarConversation = `https://ht.timviec365.vn:9002/avatarGroup/${listCons[index].conversationId}/${listCons[index].avatarConversation}`;
            }
            if (listCons[index].isGroup && !avatarConversation) {
                avatarConversation = `https://ht.timviec365.vn:9002/avatar/${removeVietnameseTones(conversationName)
                    .substring(0, 1)
                    .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
            }
            // xử lý danh sách thành viên trong cuộc hội thoại 
            listCons[index].listMember = combinedNewDataMember;
            // xử lý tên thành viên trong cuộc hội thoại 
            listCons[index]['conversationName'] = conversationName !== '' ? conversationName : owner.userName;
            // xử lý ava cuộc hội thoại 
            listCons[index].avatarConversation = avatarConversation;
            listCons[index].linkAvatar = avatarConversation;
            // if (listCons[index].browseMemberList.length) {
            //     listCons[index].browseMemberList = listCons[index].browseMemberList.map((e) => {
            //         const memberBrowserId = e.memberBrowserId;
            //         const dataBrowerMem = listCons[index].listBrowse.find((e) => e._id === memberBrowserId);
            //         if (dataBrowerMem && dataBrowerMem.lastActive && dataBrowerMem.avatarUser) {
            //             if (dataBrowerMem && dataBrowerMem.lastActive) {
            //                 dataBrowerMem.lastActive =
            //                     date.format(dataBrowerMem.lastActive, 'YYYY-MM-DDTHH:mm:ss.SSS+07:00') ||
            //                     date.format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
            //             } else {
            //                 dataBrowerMem.lastActive = date.format(new Date(), 'YYYY-MM-DDTHH:mm:ss.SSS+07:00');
            //             }
            //             if (dataBrowerMem && dataBrowerMem.avatarUser) {
            //                 dataBrowerMem.avatarUser = dataBrowerMem.avatarUser ?
            //                     `https://ht.timviec365.vn:9002/avatarUser/${e._id}/${dataBrowerMem.avatarUser}` :
            //                     `https://ht.timviec365.vn:9002/avatar/${removeVietnameseTones(dataBrowerMem.userName)
            //                         .substring(0, 1)
            //                         .toUpperCase()}_${Math.floor(Math.random() * 4) + 1}.png`;
            //             }
            //             return (e = {
            //                 userMember: dataBrowerMem,
            //                 memberAddId: e.memberAddId,
            //             });
            //         }
            //     });
            // }
            // delete listCons[index]['listBrowse'];
            delete listCons[index]['memberList'];
            delete listCons[index]['listMenZalo'];
            if(!listCons[index].createAt) listCons[index].createAt = new Date()
        }
        data['conversation_info'] = listCons;
        return res.status(200).send({ data, error: null });
    } catch (err) {
        console.log(err);
        if (err) return res.status(200).send(createError(200, err.mesesage));
    }
};

export const TokenZalo = async (req, res) => {
    try {
        const Type = Number(req.body.Type)
        const oa_id = req.body.oa_id 
        const app_id = req.body.app_id 
        const access_token = req.body.access_token 
        const refresh_token = req.body.refresh_token
        const name = req.body.name

        if(!Type || oa_id == 0){// validate dữ liệu
           return res.status(409).send(createError(409, "Thiếu trường truyền lên"));
        }
        // thêm dữ liệu vào bảng 
        if(Type == 0){
        
        const check = await Token.findOne({ oa_id: oa_id }).lean();
        if(!check){
            let max = await Token.findOne({},{_id :1}).sort({_id : -1}).lean() || 0
            const insert = new Token({
                _id : Number(max._id) + 1 || 1,
                name : name,
                oa_id : oa_id,
                app_id : app_id,
                access_token : access_token,
                refresh_token : refresh_token,
            })
            await insert.save()
            return res.status(200).send({ code: 200, message : "Tạo thành công", error: null });
        }
        return res.status(409).send(createError(409, "Tài khoản OA đã tồn tại"));



        // lấy token
        }else if(Type == 1){
        
        const getToken = await Token.findOne({ oa_id: oa_id }).lean();
            if(getToken){
                return res.status(200).send({ code: 200, message : "Lấy thành công",data : getToken, error: null });
                }
            return res.status(409).send(createError(409, "Tài khoản OA không tồn tại"));



        // cập nhật token
        }else if(Type == 2){

            await Token.updateOne({ oa_id: oa_id },{
                access_token : access_token,
                refresh_token : refresh_token,
                Update_at : Date.parse(new Date())
            });
            return res.status(200).send(createError(200, " Cập nhật thành công"));

        }else if(Type == 3){// thêm thông tin cty trên server

                const saveToken = await axios({
                    method: 'post',
                    url: 'http://210.245.108.202:9000/api/conversations/TokenZalo',
                    data: {
                      Type:"0",
                      oa_id:"579745863508352884", // id Cty Hưng Việt
                      access_token:"6hErRFw5kGuSlhXW_8Yr3XcwlM__bizJ7-6WReUvrqW4-ffvbRJOPYU6rrM7j8ra3Tlv0fMjyXfqmQOIz_gk7N2k_GNNohycCUN0FOcmYYWOXe98YEcBMmI5rsI-zfS1LPB2OCUeedrIpyyOoxt03N-Cko_WpBH1TARZREENkWnaeEHer9E3N4h5z3_FW80hNUVnAkkfXGTDtTPfzxV326E3WplgkTubNlFJ4BkmemCjnzenYBIXCYd0xn2Ncw0f5zVy68cFgW42sTivfksCFLZTu0lRY9afOB_I5kFie1jeYFadwTkl9m-9ypoHkAO65E_E6fBTdJGvffCwskRx27cIgsVY-DXwVik_VFkMx6DQvPzzvQBLGM34gtZMzwLWCh_eOQxodNyieC4SoiM80cFqXcNJ0ZXN_P-_3m",
                      refresh_token:"lluoBdFqnXwuypyYSVdA7httEYrovurzkh48I3VZ-0I3jqreJENF2_g2MLfdZFTjfDf476_KxNpjkXGrO-2QG-wOEHCbah9yaFP37ZEdw5ETtKiFBwVoMOJ8SnKDl89WkRKp9oMzntEoirKF2jNxPPtO0YrJkRf_mV4gJr61hHtcpLbRPONLFCVLN009fEetWTSU1HAJit2Ftpz2JA-t2u3RG5X2bieMqkH7Ad-q_b_ap0m2SBgRQUdK6YiZs8zFY9T-B3wP-cMjm7ibRi_8JAIrJIeVlVbEZTDSUnQ2hYwFobT18h757BEwDo4_piP6fwXH6clIr6RwX6G9R-3tDQIrQ7CGpTXFcyD1ArUPh4V2uneoOQoPNQptDGS4dRrbYz8GMJEAwJ2-zMP79Oh02pLu-Zx01N3km1y",
                      app_id:"2474451999345960065",
                      name:"Cty Hưng Việt"
                    },
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                // console.log(saveToken.data.data.data)
                return res.status(200).send({ code: 200, message : "Lấy thành công",data : saveToken.data.data, error: null });

        }else if(Type == 5){// cập nhật token trên server

                const saveToken = await axios({
                    method: 'post',
                    url: 'http://210.245.108.202:9000/api/conversations/TokenZalo',
                    data: {
                      Type:"2",
                      oa_id:"579745863508352884", // id Cty Hưng Việt
                      access_token:"6hErRFw5kGuSlhXW_8Yr3XcwlM__bizJ7-6WReUvrqW4-ffvbRJOPYU6rrM7j8ra3Tlv0fMjyXfqmQOIz_gk7N2k_GNNohycCUN0FOcmYYWOXe98YEcBMmI5rsI-zfS1LPB2OCUeedrIpyyOoxt03N-Cko_WpBH1TARZREENkWnaeEHer9E3N4h5z3_FW80hNUVnAkkfXGTDtTPfzxV326E3WplgkTubNlFJ4BkmemCjnzenYBIXCYd0xn2Ncw0f5zVy68cFgW42sTivfksCFLZTu0lRY9afOB_I5kFie1jeYFadwTkl9m-9ypoHkAO65E_E6fBTdJGvffCwskRx27cIgsVY-DXwVik_VFkMx6DQvPzzvQBLGM34gtZMzwLWCh_eOQxodNyieC4SoiM80cFqXcNJ0ZXN_P-_3m",
                      refresh_token:"203MJ7ypF1SE3Tj0VJum5mi9taz-85OGS1MuIrD5ALLzDy9CPNv9Sa19noXwF74ENqBTKIOLEaiDVzDY9HrBGZPBnnGSEIWk10p22ZOzRGj2Qz9HU3fUJrH7jKL_2Jf4LKIbG6SrCrbHLxb5HW40HMnMl5aO72XM0YsZLmnwANCz2BzE2ritTd8PssjKHcjSVJBRULnWLtbh7TnwG4vJ8c4ht3LCTaGoH2RB5M8MPo9nU-5-VGPf9bPl_2bb2tPsG62GMrWn07fKJkXbGo57UNfXj2PF7riyR4Uy2se4DYvRJwCtQZms1cSElI0KK343EGEyEpPCDpim7eTW1quNKIq6dH8dSWep2IImEImE2sy9M_X69YmHSGq6gtmbJYHM70YmG30wEtuZROvQ3GS10nLKk0n4MK07tcvyAJeM",
                    },
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                // console.log(saveToken.data.data.data)
                return res.status(200).send({ code: 200, message : "cập nhật token thành công",data : saveToken.data.data, error: null });
        }else if(Type == 4){// lấy thông tin cty trên server

                const saveToken = await axios({
                    method: 'post',
                    url: 'http://210.245.108.202:9000/api/conversations/TokenZalo',
                    data: {
                      Type:"1",
                      oa_id:"579745863508352884",
                    },
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                return res.status(200).send({ code: 200, message : "Lấy thành công",data : saveToken.data.data, error: null });

        }else{
            return res.status(409).send(createError(409, "Vui lòng nhập type = 1, 2"));
        }
      
    } catch (err) {
        console.log(err);
        if (err) return res.status(200).send(createError(200, err.mesesage));
    }
};