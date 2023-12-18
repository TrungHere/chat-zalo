export const LoadMessageZalo = async (req, res, next) => {
  try {
    if (req.body.token) {
      let check = await checkToken(req.body.token);
      if (check && check.status) {
        console.log("Token hop le, LoadMessage");
      } else {
        return res.status(404).json(createError(404, "Invalid token"));
      }
    }
    if (
      req.body &&
      req.body.conversationId &&
      !isNaN(req.body.conversationId) &&
      Number(req.body.conversationId)
    ) {
      let countMess = await Conversation.aggregate([
        { $match: { _id: Number(req.body.conversationId) } },
        { $project: { count: { $size: "$messageList" } } },
      ]);
      console.log("tesst", countMess);
      let countMessReturn;
      let listMess = Number(req.body.listMess) || 0;
      if (listMess == 0) {
        let check = HandleUntiLoadMessage(
          Number(req.body.adminId),
          Number(req.body.conversationId)
        );
        if (!check) {
          return res.status(200).json(createError(200, "Spam"));
        }
      }

      let dataUserSend = [];
      if (
        countMess &&
        countMess.length &&
        countMess.length > 0 &&
        countMess[0]._id
      ) {
        countMessReturn = countMess[0].count;
        let sizeListMess = countMess[0].count - 1;
        if (sizeListMess < 0) {
          sizeListMess = 0;
        }
        let start = sizeListMess - listMess - 15;
        if (start < 0) {
          start = 0;
        }

        let conversation;
        if (req.body.startDay && req.body.endDay) {
          conversation = [];
          let conversationFirst = await Conversation.aggregate([
            {
              $match: {
                _id: Number(req.body.conversationId),
              },
            },
            { $limit: 1 },
            {
              $project: {
                messageList: {
                  $filter: {
                    input: "$messageList",
                    cond: {
                      $and: [
                        {
                          $gte: [
                            "$$messagelist.createAt",
                            new Date(req.body.startDay),
                          ],
                        },
                        {
                          $lt: [
                            "$$messagelist.createAt",
                            new Date(req.body.endDay),
                          ],
                        },
                      ],
                    },
                    as: "messagelist",
                  },
                },
                favoriteMessage: 1,
                "memberList.memberId": 1,
                "memberList.lastMessageSeen": 1,
                "memberList.timeLastSeener": 1,
                "memberList.deleteTime": 1,
              },
            },
          ]);

          let obj = {};
          obj.favoriteMessage = conversationFirst[0].favoriteMessage || "";
          obj.memberList = conversationFirst[0].memberList;
          let lengthArr = conversationFirst[0].messageList.length;
          let startTake = lengthArr - listMess - 30;
          let endTake = startTake + 30;
          if (endTake > lengthArr) {
            endTake = lengthArr;
          }
          if (startTake < 0) {
            startTake = 0;
          }

          if (req.body.fromHead) {
            startTake = listMess;
            endTake = startTake + 30;
          }

          obj.messageList = conversationFirst[0].messageList.slice(
            startTake,
            endTake
          );
          let arr_userId = [];
          for (let i = 0; i < obj.messageList.length; i++) {
            if (!arr_userId.includes(obj.messageList[i].senderId)) {
              arr_userId.push(obj.messageList[i].senderId);
            }
          }
          dataUserSend = await User.find(
            { _id: { $in: arr_userId } },
            { _id: 1, userName: 1 }
          ).lean();
          conversation.push(obj);
          countMessReturn = conversationFirst[0].messageList.length;
        } else {
          conversation = await Conversation.find(
            { _id: Number(req.body.conversationId) },
            {
              messageList: { $slice: [start, 16] },
              "memberList.favoriteMessage": 1,
              "memberList.memberId": 1,
              "memberList.lastMessageSeen": 1,
              "memberList.timeLastSeener": 1,
              "memberList.deleteTime": 1,
            }
          ).lean();
        }

        if (conversation) {
          if (conversation.length > 0) {
            let ListMessFavour = [];
            if (req.body.adminId && !isNaN(req.body.adminId)) {
              if (
                conversation[0].memberList &&
                conversation[0].memberList.length &&
                conversation[0].memberList.length > 0 &&
                conversation[0].memberList.findIndex(
                  (e) => e.memberId == Number(req.body.adminId)
                ) != -1
              ) {
                let memberInfor = conversation[0].memberList.find(
                  (e) => e.memberId == Number(req.body.adminId)
                );
                if (memberInfor && memberInfor.memberId) {
                  ListMessFavour = memberInfor.favoriteMessage || [];
                }
              }
            }

            let ListMessFinal = [];
            let ListMes = conversation[0].messageList;
            let listMember = conversation[0].memberList;
            let arr_check = [];
            let time = Date.now();
            for (let i = 0; i < ListMes.length; i++) {
              if (
                ListMes[i]._id &&
                ListMes[i].senderId &&
                ListMes[i].messageType
              ) {
                let a = {};
                a.messageID = ListMes[i]._id;
                if (!arr_check.includes(ListMes[i]._id)) {
                  arr_check.push(ListMes[i]._id);
                } else {
                  a.messageID = `${String(
                    Math.floor(Math.random() * 1000000000000)
                  )}_${ListMes[i].senderId}`;
                }
                a.conversationID = Number(req.body.conversationId);
                a.displayMessage = ListMes[i].displayMessage || 0;
                a.senderID = ListMes[i].senderId;
                a.messageType = ListMes[i].messageType;
                a.message = ListMes[i].message || "";
                a.uscid = ListMes[i].uscid || "";
                a.listDeleteUser = ListMes[i].listDeleteUser;
                a.isSecret = ListMes[i].isSecret || 0;
                if (
                  ListMes[i].quoteMessage &&
                  ListMes[i].quoteMessage.trim() != ""
                ) {
                  let conversationTakeMessage = await Conversation.aggregate([
                    {
                      $match: {
                        "messageList._id": ListMes[i].quoteMessage,
                      },
                    },
                    {
                      $project: {
                        messageList: {
                          $slice: [
                            {
                              $filter: {
                                input: "$messageList",
                                as: "messagelist",
                                cond: {
                                  $eq: [
                                    "$$messagelist._id",
                                    ListMes[i].quoteMessage,
                                  ],
                                },
                              },
                            },
                            -1,
                          ],
                        },
                      },
                    },
                  ]);
                  if (
                    conversationTakeMessage &&
                    conversationTakeMessage.length > 0 &&
                    conversationTakeMessage[0].messageList &&
                    conversationTakeMessage[0].messageList.length &&
                    conversationTakeMessage[0].messageList.length > 0
                  ) {
                    let message = conversationTakeMessage[0].messageList[0];
                    let senderData = await User.findOne(
                      { _id: message.senderId },
                      { userName: 1 }
                    );
                    if (
                      senderData &&
                      senderData.userName &&
                      message._id &&
                      message.senderId &&
                      message.createAt
                    ) {
                      a.quoteMessage = fMessageQuote(
                        message._id,
                        senderData.userName,
                        message.senderId,
                        message.messageType || "text",
                        message.message,
                        message.createAt
                      );
                    } else {
                      a.quoteMessage = null;
                    }
                  } else {
                    a.quoteMessage = fMessageQuote(
                      ListMes[i].quoteMessage,
                      "",
                      -1,
                      "text",
                      "",
                      `${JSON.parse(
                        JSON.stringify(
                          new Date(
                            ListMes[i].createAt.setHours(
                              ListMes[i].createAt.getHours() + 7
                            )
                          )
                        )
                      ).replace("Z", "")}+07:00`
                    );
                  }
                } else {
                  a.quoteMessage = null;
                }
                a.messageQuote = ListMes[i].messageQuote || "";
                a.createAt = `${JSON.parse(
                  JSON.stringify(
                    new Date(
                      ListMes[i].createAt.setHours(
                        ListMes[i].createAt.getHours() + 7
                      )
                    )
                  )
                ).replace("Z", "")}+07:00`;
                a.isEdited = ListMes[i].isEdited || 0;
                if (ListMes[i].infoLink) {
                  a.infoLink = fInfoLink(
                    ListMes[i]._id,
                    ListMes[i].infoLink.title,
                    ListMes[i].infoLink.description,
                    ListMes[i].infoLink.linkHome,
                    ListMes[i].infoLink.image,
                    ListMes[i].infoLink.isNotification
                  );
                } else {
                  a.infoLink = null;
                }
                if (
                  ListMes[i].listFile &&
                  ListMes[i].listFile.length &&
                  ListMes[i].listFile.length > 0
                ) {
                  let listFileFirst = [];
                  for (let j = 0; j < ListMes[i].listFile.length; j++) {
                    listFileFirst.push(
                      fInfoFile(
                        ListMes[i].listFile[j].messageType || "",
                        ListMes[i].listFile[j].nameFile || "",
                        ListMes[i].listFile[j].sizeFile || 0,
                        ListMes[i].listFile[j].height || 0,
                        ListMes[i].listFile[j].width || 0
                      )
                    );
                  }
                  a.listFile = listFileFirst;
                } else {
                  a.listFile = [];
                }
                if (
                  ListMes[i].localFile &&
                  ListMes[i].localFile.length &&
                  ListMes[i].localFile.length > 0
                ) {
                  let localFileFirst = [];
                  for (let j = 0; j < ListMes[i].localFile.length; j++) {
                    localFileFirst.push(
                      localfile(
                        ListMes[i].localFile[j].IdDevice || "",
                        ListMes[i].localFile[j].pathFile || ""
                      )
                    );
                  }
                  a.localFile = localFileFirst;
                } else {
                  a.localFile = [];
                }
                if (a.messageType == "sendCv") {
                  for (let j = 0; j < a.listFile.length; j++) {
                    if (
                      a.listFile[j].fullName.split(".")[
                        a.listFile[j].fullName.split(".").length - 1
                      ] == "pdf"
                    ) {
                      a.linkPdf = `http://210.245.108.202:9002/uploads/${a.listFile[j].fullName}`;
                    } else if (
                      a.listFile[j].fullName.split(".")[
                        a.listFile[j].fullName.split(".").length - 1
                      ] == "png"
                    ) {
                      a.linkPng = `http://210.245.108.202:9002/uploads/${a.listFile[j].fullName}`;
                    }
                  }
                }
                a.emotionMessage = [];
                if (ListMes[i].emotion) {
                  if (
                    ListMes[i].emotion.Emotion1 &&
                    String(ListMes[i].emotion.Emotion1).trim() != ""
                  ) {
                    a.emotionMessage.push(
                      fEmotion(
                        1,
                        ListMes[i].emotion.Emotion1.split(","),
                        `${urlImgHost()}Emotion/Emotion1.png`
                      )
                    );
                  }
                  if (
                    ListMes[i].emotion.Emotion2 &&
                    String(ListMes[i].emotion.Emotion2).trim() != ""
                  ) {
                    a.emotionMessage.push(
                      fEmotion(
                        2,
                        ListMes[i].emotion.Emotion2.split(","),
                        `${urlImgHost()}Emotion/Emotion2.png`
                      )
                    );
                  }
                  if (
                    ListMes[i].emotion.Emotion3 &&
                    String(ListMes[i].emotion.Emotion3).trim() != ""
                  ) {
                    a.emotionMessage.push(
                      fEmotion(
                        3,
                        ListMes[i].emotion.Emotion3.split(","),
                        `${urlImgHost()}Emotion/Emotion3.png`
                      )
                    );
                  }
                  if (
                    ListMes[i].emotion.Emotion4 &&
                    String(ListMes[i].emotion.Emotion4).trim() != ""
                  ) {
                    a.emotionMessage.push(
                      fEmotion(
                        4,
                        ListMes[i].emotion.Emotion4.split(","),
                        `${urlImgHost()}Emotion/Emotion4.png`
                      )
                    );
                  }
                  if (
                    ListMes[i].emotion.Emotion5 &&
                    String(ListMes[i].emotion.Emotion5).trim() != ""
                  ) {
                    a.emotionMessage.push(
                      fEmotion(
                        5,
                        ListMes[i].emotion.Emotion5.split(","),
                        `${urlImgHost()}Emotion/Emotion5.png`
                      )
                    );
                  }
                  if (
                    ListMes[i].emotion.Emotion6 &&
                    String(ListMes[i].emotion.Emotion6).trim() != ""
                  ) {
                    a.emotionMessage.push(
                      fEmotion(
                        6,
                        ListMes[i].emotion.Emotion6.split(","),
                        `${urlImgHost()}Emotion/Emotion6.png`
                      )
                    );
                  }
                  if (
                    ListMes[i].emotion.Emotion7 &&
                    String(ListMes[i].emotion.Emotion7).trim() != ""
                  ) {
                    a.emotionMessage.push(
                      fEmotion(
                        7,
                        ListMes[i].emotion.Emotion7.split(","),
                        `${urlImgHost()}Emotion/Emotion7.png`
                      )
                    );
                  }
                  if (
                    ListMes[i].emotion.Emotion8 &&
                    String(ListMes[i].emotion.Emotion8).trim() != ""
                  ) {
                    a.emotionMessage.push(
                      fEmotion(
                        8,
                        ListMes[i].emotion.Emotion8.split(","),
                        `${urlImgHost()}Emotion/Emotion8.png`
                      )
                    );
                  }
                } else {
                  a.emotion = ListMes[i].emotion || {};
                  a.emotionMessage = [];
                }
                if (ListMes[i].messageType == "sendProfile") {
                  if (!isNaN(ListMes[i].message)) {
                    let userData = await User.findOne({
                      _id: ListMes[i].message,
                    });
                    if (userData && userData.userName) {
                      let b = {};
                      b.iD365 = userData.id365;
                      b.idTimViec = userData.idTimViec;
                      b.type365 = userData.type365;
                      b.password = "";
                      b.phone = userData.phone;
                      b.notificationPayoff = 0;
                      b.notificationCalendar = 1;
                      b.notificationReport = 1;
                      b.notificationOffer = 1;
                      b.notificationPersonnelChange = 1;
                      b.notificationRewardDiscipline =
                        userData.notificationRewardDiscipline;
                      b.notificationNewPersonnel =
                        userData.notificationNewPersonnel;
                      b.notificationChangeProfile =
                        userData.notificationChangeProfile;
                      b.notificationTransferAsset =
                        userData.notificationTransferAsset;
                      b.acceptMessStranger = userData.acceptMessStranger;
                      b.type_Pass = 0;
                      b.companyName = userData.companyName;
                      b.secretCode = "";
                      b.notificationMissMessage = 0;
                      b.notificationCommentFromTimViec = 0;
                      b.notificationCommentFromRaoNhanh = 0;
                      b.notificationTag = 0;
                      b.notificationSendCandidate = 0;
                      b.notificationChangeSalary = 0;
                      b.notificationAllocationRecall = 0;
                      b.notificationAcceptOffer = 0;
                      b.notificationDecilineOffer = 0;
                      b.notificationNTDPoint = 0;
                      b.notificationNTDExpiredPin = 0;
                      b.notificationNTDExpiredRecruit = 0;
                      b.fromWeb = userData.fromWeb;
                      b.notificationNTDApplying = 0;
                      b.userQr = null;
                      b.id = userData._id;
                      b.email = userData.email;
                      b.userName = userData.userName;
                      b.avatarUserSmall = GetAvatarUserSmall(
                        userData._id,
                        userData.userName,
                        userData.avatarUser
                      );
                      b.avatarUser = GetAvatarUser(
                        userData._id,
                        userData.type,
                        userData.fromWeb,
                        userData.createdAt,
                        userData.userName,
                        userData.avatarUser
                      );
                      b.status = userData.status;
                      b.active = userData.active;
                      b.isOnline = userData.isOnline;
                      b.looker = userData.looker;
                      b.statusEmotion = userData.statusEmotion;
                      b.lastActive = userData.lastActive;

                      if (String(userData.avatarUser).trim != "") {
                        b.linkAvatar = `${urlImgHost()}avatarUser/${
                          userData._id
                        }/${userData.avatarUser}`;
                      } else {
                        b.linkAvatar = `${urlImgHost()}avatar/${
                          userData.userName[0]
                        }_${getRandomInt(1, 4)}.png`;
                      }
                      b.companyId = userData.companyId;

                      let status = await RequestContact.findOne({
                        $or: [
                          {
                            userId: Number(req.body.adminId),
                            contactId: userData._id,
                          },
                          {
                            userId: userData._id,
                            contactId: Number(req.body.adminId),
                          },
                        ],
                      }).lean();
                      if (status) {
                        if (status.status == "accept") {
                          b.friendStatus = "friend";
                        } else {
                          b.friendStatus = status.status;
                        }
                      } else {
                        b.friendStatus = "none";
                      }
                      a.userProfile = b;
                    } else {
                      a.userProfile = null;
                    }
                  }
                } else {
                  a.userProfile = null;
                }
                a.listTag = null;
                a.link = ListMes[i].infoLink.linkHome;
                a.linkNotification = ListMes[i].infoLink.linkHome;
                a.file = a.listFile;
                a.quote = null;
                a.profile = a.userProfile;
                a.deleteTime = ListMes[i].deleteTime;
                a.deleteType = ListMes[i].deleteType;
                if (a.isSecret == 1) {
                  a.deleteType = 1;
                }
                a.deleteDate = String("0001-01-01T00:00:00.000+00:00");
                a.infoSupport = ListMes[i].infoSupport;
                a.liveChat = ListMes[i].liveChat;
                a.isClicked = ListMes[i].isClicked || 0;
                a.inforSeen = [];
                for (let j = 0; j < listMember.length; j++) {
                  if (a.messageID == listMember[j].lastMessageSeen) {
                    a.inforSeen.push({
                      memberId: listMember[j].memberId,
                      seenTime: listMember[j].timeLastSeener,
                    });
                  }
                }
                if (ListMes[i] && ListMes[i].notiClicked) {
                  if (
                    ListMes[i].notiClicked.includes(Number(req.body.adminId))
                  ) {
                    a.isClicked = 1;
                  }
                }
                if (ListMessFavour && ListMessFavour.includes(ListMes[i]._id)) {
                  a.IsFavorite = 1;
                } else {
                  a.IsFavorite = 0;
                }

                //if (ListMes[i].messageType == "OfferReceive" || ListMes[i].messageType == "applying") {
                //if (ListMes[i + 1]) {
                //a.linkNotification = ListMes[i + 1].message || "";
                //a.infoLink = fInfoLink(ListMes[i + 1]._id, ListMes[i + 1].infoLink.title, ListMes[i + 1].infoLink.description, ListMes[i + 1].infoLink.linkHome, ListMes[i + 1].infoLink.image, ListMes[i + 1].infoLink.isNotification);
                //}
                //}
                let flagPushMessage = true;
                if (i > 0) {
                  if (
                    ListMes[i - 1] &&
                    ListMes[i] &&
                    ListMes[i - 1].messageType &&
                    ListMes[i].messageType
                  ) {
                    if (ListMes[i - 1].messageType == "OfferReceive") {
                      if (ListMes[i].messageType == "link") {
                        flagPushMessage = true;
                      }
                    } else if (ListMes[i - 1].messageType == "applying") {
                      if (ListMes[i].messageType == "link") {
                        flagPushMessage = true;
                      }
                    }
                  }
                }
                if (ListMes[i].isEdited == 2) {
                  if (
                    ListMes[i].listDeleteUser &&
                    req.body.adminId &&
                    ListMes[i].listDeleteUser.length &&
                    ListMes[i].listDeleteUser.find(
                      (e) => e == Number(req.body.adminId)
                    )
                  ) {
                    flagPushMessage = false;
                  }
                }
                if (ListMes[i].infoSupport) {
                  if (ListMes[i].infoSupport.status) {
                    if (ListMes[i].infoSupport.status == 1) {
                      let b = "k add";
                    } else {
                      if (flagPushMessage) {
                        ListMessFinal.push(a);
                      }
                    }
                  } else {
                    if (flagPushMessage) {
                      ListMessFinal.push(a);
                    }
                  }
                } else {
                  if (flagPushMessage) {
                    ListMessFinal.push(a);
                  }
                }
              }
            }
            res.json({
              data: {
                result: true,
                messsage: "Lấy danh sách tin nhắn thành công",
                countMessage: countMessReturn,
                message_info: null,
                listMessages: ListMessFinal,
                dataUserSend,
              },
              error: null,
            });
          } else {
            res.json({
              data: {
                result: true,
                messsage: "Lấy danh sách tin nhắn thành công",
                countMessage: 0,
                message_info: null,
                listMessages: [],
              },
              error: null,
            });
          }
        }
      } else {
        res.json({
          data: {
            result: true,
            messsage: "Lấy danh sách tin nhắn thành côngg",
            countMessage: 0,
            message_info: null,
            listMessages: [],
          },
          error: null,
        });
      }
    } else {
      res
        .status(200)
        .json(createError(200, "Thông tin truyền lên không đầy đủ"));
    }
  } catch (e) {
    console.log(e);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};