'use strict';

// In-memory database to store threads and replies
const threads = [];

module.exports = function (app) {
  
  // Routes for threads
  app.route('/api/threads/:board')
    .get((req, res) => {
      const { board } = req.params;
      
      // Get the 10 most recent threads with 3 replies each, excluding reported and delete_password fields
      const boardThreads = threads
        .filter(thread => thread.board === board)
        .sort((a, b) => b.bumped_on - a.bumped_on)
        .slice(0, 10)
        .map(thread => ({
          _id: thread._id,
          text: thread.text,
          created_on: thread.created_on,
          bumped_on: thread.bumped_on,
          replies: thread.replies.slice(-3).map(reply => ({
            _id: reply._id,
            text: reply.text,
            created_on: reply.created_on,
          }))
        }));
      
      res.json(boardThreads);
    })
    .post((req, res) => {
      const { board } = req.params;
      const { text, delete_password } = req.body;

      // Create a new thread
      const newThread = {
        _id: Date.now().toString(),
        text,
        created_on: new Date(),
        bumped_on: new Date(),
        reported: false,
        delete_password,
        replies: [],
        board
      };

      threads.push(newThread);
      res.json(newThread);
    })
    .delete((req, res) => {
      const { thread_id, delete_password } = req.body;

      // Find and delete the thread
      const threadIndex = threads.findIndex(thread => thread._id === thread_id);
      if (threadIndex === -1) return res.status(404).send('Thread not found');
      if (threads[threadIndex].delete_password !== delete_password) return res.status(401).send('incorrect password');

      threads.splice(threadIndex, 1);
      res.send('success');
    })
    .put((req, res) => {
      const { thread_id } = req.body;

      // Find and report the thread
      const thread = threads.find(thread => thread._id === thread_id);
      if (!thread) return res.status(404).send('Thread not found');

      thread.reported = true;
      res.send('reported');
    });

  // Routes for replies
  app.route('/api/replies/:board')
    .get((req, res) => {
      const { thread_id } = req.query;

      // Find a thread and return all replies
      const thread = threads.find(thread => thread._id === thread_id);
      if (!thread) return res.status(404).send('Thread not found');

      const threadData = {
        _id: thread._id,
        text: thread.text,
        created_on: thread.created_on,
        bumped_on: thread.bumped_on,
        replies: thread.replies.map(reply => ({
          _id: reply._id,
          text: reply.text,
          created_on: reply.created_on
        }))
      };
      
      res.json(threadData);
    })
    .post((req, res) => {
      const { thread_id, text, delete_password } = req.body;

      // Create a new reply
      const thread = threads.find(thread => thread._id === thread_id);
      if (!thread) return res.status(404).send('Thread not found');

      const newReply = {
        _id: Date.now().toString(),
        text,
        delete_password,
        created_on: new Date(),
        reported: false
      };

      thread.replies.push(newReply);
      thread.bumped_on = new Date(); // Update bumped_on when a new reply is added
      res.json(thread);
    })
    .delete((req, res) => {
      const { thread_id, reply_id, delete_password } = req.body;

      // Delete a reply
      const thread = threads.find(thread => thread._id === thread_id);
      if (!thread) return res.status(404).send('Thread not found');

      const reply = thread.replies.find(reply => reply._id === reply_id);
      if (!reply) return res.status(404).send('Reply not found');
      if (reply.delete_password !== delete_password) return res.status(401).send('incorrect password');

      reply.text = '[deleted]';  // Mark reply as deleted instead of removing it
      res.send('success');
    })
    .put((req, res) => {
      const { thread_id, reply_id } = req.body;

      // Report a reply
      const thread = threads.find(thread => thread._id === thread_id);
      if (!thread) return res.status(404).send('Thread not found');

      const reply = thread.replies.find(reply => reply._id === reply_id);
      if (!reply) return res.status(404).send('Reply not found');

      reply.reported = true;
      res.send('reported');
    });
};
