var express = require('express');
var router = express.Router();
var db = require('../db/db');
var constants = require("../constants");
var ObjectId = require('mongodb').ObjectId;

// GET Group for Id
router.get('/:id', function (req, res) {
    db.Group.findOne({ '_id': ObjectId(req.params.id)}, function (err, group) {
        if (err || group === null)
            res.status(400).send({ error: "No Group found for Id" });
        else
            res.status(200).send(group);
    })
});

// POST to create new Group for User
router.post('/user/:id',function(req, res){
    db.User.findOne( { '_id': ObjectId(req.params.id) }, function (err, user) {
        if (err || user === null) {
            res.status(404).send({ error: "User not found" });
        } else {
            // list of group id's
            var group = new db.Group;
            var generalChannel = new db.Chat;
            var selfDirectChannel = new db.Chat;
            // General channel
            generalChannel.name = constants.general;
            generalChannel.group = group.id;
            generalChannel.isGroupMessage = true;
            generalChannel.participants.push(user.id);
            generalChannel.save();
            // A direct channel where the User is the only participant
            selfDirectChannel.group = group.id;
            selfDirectChannel.isGroupMessage = false;
            selfDirectChannel.participants.push(user.id);
            selfDirectChannel.save();
            // Group created
            group.name = req.body.name;
            group.desc = req.body.desc;
            group.creator = user.id;
            group.participants.push(user.id);
            group.courses = req.body.courses;
            group.chats.push(generalChannel.id);
            group.chats.push(selfDirectChannel.id);
            group.semester = req.body.semester;
            group.academicYear = req.body.academicYear;
            group.isPrivate = req.body.isPrivate;
            group.days = req.body.days;
            group.save();
            user.groups.push(group.id);
            user.save();
            console.log(group);
            res.status(200).send(group);
        }
    });
});

// PATCH Group by id
router.patch('/:id', function(req, res) {
    db.Group.findOne({ '_id': ObjectId(req.params.id) }, function (err, group) {
        if (err || group === null)
            res.status(400).send({ error: "No Group found for Id" });
        else {
            var updatedGroup = req.body;
            var id = req.params.id;
            db.Group.update({_id  : ObjectId(id)}, {$set: updatedGroup}, function (err, group) {
                if (err || group === null)
                    res.status(500).send({ error: "Error saving Group" });
                else
                    res.status(200).send(group);
            });
        }
    })
});

// DELETE Group by id
router.delete('/:id', function (req, res) {
   db.Group.findOne({ '_id': req.params.id }, function (err, group) {
       if (err || group === null)
           res.status(404).send({ error: "Group not found" });
       else {
           group.remove();
           res.status(200).send({ success: "Group deleted" });
       }
   });
});

// GET all Groups for User
router.get('/user/:id', function (req, res) {
    db.User.findOne({ '_id': ObjectId(req.params.id) }, function (err, user) {
        if (err || user === null) {
            res.status(404).send({ error: "User not found" });
        } else {
            db.Group.find({
                '_id': { $in: user.groups }
            }, function (err, groups) {
                if (err || groups === null || groups.length === 0)
                    res.status(400).send([]);
                else
                    res.status(200).send(groups);
            });
        }
    });
});

// GET Participants (Users) for Group
router.get('/:id/users', function (req, res) {
   db.Group.findOne({ '_id': ObjectId(req.params.id) }, function (err, group) {
       if (err || group === null) {
           res.status(400).send({ error: "Group not found" });
       } else {
           db.User.find({
               '_id': { $in: group.participants }
           }, function (err, users) {
               if (err || users === null || users.length === 0)
                   res.status(400).send([]);
               else
                   res.status(200).send(users);
           });
       }
   })
});

// GET Add User to Group
router.get('/:groupId/users/new/:userId', function (req, res) {
    db.Group.findOne({ '_id': req.params.groupId }, function (err, group) {
        if (err || group === null)
            res.status(400).send({ error: "Group not found" });
        else  {
            db.User.findOne({
                '_id': req.params.userId
            }, function (err, user) {
                if (err || user === null)
                    res.status(400).send({ error: "User not found "});
                else {
                    group.participants.push(user.id);
                    user.groups.push(group.id);
                    var selfDirectChannel = new db.Chat;
                    selfDirectChannel.group = group.id;
                    selfDirectChannel.isGroupMessage = false;
                    selfDirectChannel.participants.push(user.id);
                    selfDirectChannel.save();
                    group.save();
                    user.save();
                    db.Chat.findOne({
                        'group': ObjectId(group.id),
                        'name': constants.general
                    }, function (err, chat) {
                        if (err || chat === null)
                            res.status(400).send({ error: "Group is missing general! "});
                        else {
                            chat.participants.push(user.id);
                            chat.save();
                            res.status(200).send(user);
                        }
                    });
                }
            });
        }
    });
});

module.exports = router;
