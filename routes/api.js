'use strict';

// In-memory data storage
let threads = [];

module.exports = function (app) {

  // THREADS ROUTES
  app.route('/api/threads/:board')
    .get((req, res) => {
      const { board } = req.params;
      console.log(`GET /api/threads/${board} called`);

      // Filter and sort threads by board, get the most recent 10 threads
      const boardThreads = threads
        .filter(thread => thread.board === board)
        .sort((a, b) => b.bumped_on - a.bumped_on)
        .slice(0, 10)
        .map(thread => {
          const threadData = {
            _id: thread._id,
            text: thread.text,
            created_on: thread.created_on,
            bumped_on: thread.bumped_on,
            replies: thread.replies.slice(-3).map(reply => ({
              _id: reply._id,
              text: reply.text,
              created_on: reply.created_on
              // Exclude delete_password and reported from replies
            }))
            // Exclude delete_password and reported from thread
          };
          console.log(`Thread returned: ${JSON.stringify(threadData)}`);
          return threadData;
        });

      console.log(`Final boardThreads response: ${JSON.stringify(boardThreads)}`);
      res.json(boardThreads);
    })
    .post((req, res) => {
      const { board } = req.params;
      const { text, delete_password } = req.body;

      console.log(`POST /api/threads/${board} called with text: ${text}, delete_password: ${delete_password}`);

      // Create a new thread
      const newThread = {
        _id: Date.now().toString(), // Generate a unique ID
        board,
        text,
        delete_password,
        created_on: new Date(),
        bumped_on: new Date(),
        reported: false,
        replies: []
      };

      threads.push(newThread);
      console.log(`New thread created: ${JSON.stringify(newThread)}`);
      res.json(newThread);
    })
    .delete((req, res) => {
      const { thread_id, delete_password } = req.body;
      console.log(`DELETE /api/threads/ called with thread_id: ${thread_id}, delete_password: ${delete_password}`);

      const threadIndex = threads.findIndex(thread => thread._id === thread_id);
      if (threadIndex === -1) {
        console.log('Thread not found');
        return res.status(404).send('Thread not found');
      }
      if (threads[threadIndex].delete_password !== delete_password) {
        console.log('Incorrect password for thread deletion');
        return res.status(200).send('incorrect password');
      }
      console.log('Thread successfully deleted');
      threads.splice(threadIndex, 1);
      res.send('success');
    })
    .put((req, res) => {
      const { thread_id } = req.body;
      console.log(`PUT /api/threads/ called to report thread with thread_id: ${thread_id}`);

      const thread = threads.find(thread => thread._id === thread_id);
      if (!thread) {
        console.log('Thread not found');
        return res.status(404).send('Thread not found');
      }

      thread.reported = true;
      console.log('Thread successfully reported');
      res.send('reported');
    });

  // REPLIES ROUTES
  app.route('/api/replies/:board')
    .get((req, res) => {
      const { thread_id } = req.query;
      console.log(`GET /api/replies/:board called with thread_id: ${thread_id}`);

      const thread = threads.find(thread => thread._id === thread_id);
      if (!thread) {
        console.log('Thread not found for replies');
        return res.status(404).send('Thread not found');
      }

      const threadData = {
        _id: thread._id,
        text: thread.text,
        created_on: thread.created_on,
        bumped_on: thread.bumped_on,
        replies: thread.replies.map(reply => ({
          _id: reply._id,
          text: reply.text,
          created_on: reply.created_on
          // Exclude delete_password and reported fields
        }))
      };

      console.log(`Thread with replies returned: ${JSON.stringify(threadData)}`);
      res.json(threadData);
    })
    .post((req, res) => {
      const { thread_id, text, delete_password } = req.body;
      console.log(`POST /api/replies/:board called with thread_id: ${thread_id}, text: ${text}, delete_password: ${delete_password}`);

      const thread = threads.find(thread => thread._id === thread_id);
      if (!thread) {
        console.log('Thread not found for reply');
        return res.status(404).send('Thread not found');
      }

      const newReply = {
        _id: Date.now().toString(),
        text,
        delete_password,
        created_on: new Date(),
        reported: false
      };

      thread.replies.push(newReply);
      thread.bumped_on = new Date(); // Update bumped_on date
      console.log(`New reply added: ${JSON.stringify(newReply)}`);
      res.json(thread);
    })
    .delete((req, res) => {
      const { thread_id, reply_id, delete_password } = req.body;
      console.log(`DELETE /api/replies/:board called with thread_id: ${thread_id}, reply_id: ${reply_id}, delete_password: ${delete_password}`);

      const thread = threads.find(thread => thread._id === thread_id);
      if (!thread) {
        console.log('Thread not found for reply deletion');
        return res.status(404).send('Thread not found');
      }

      const reply = thread.replies.find(reply => reply._id === reply_id);
      if (!reply) {
        console.log('Reply not found');
        return res.status(404).send('Reply not found');
      }
      if (reply.delete_password !== delete_password) {
        console.log('Incorrect password for reply deletion');
        return res.status(200).send('incorrect password');
      }

      reply.text = '[deleted]'; // Mark reply as deleted
      console.log('Reply successfully deleted (marked as [deleted])');
      res.send('success');
    })
    .put((req, res) => {
      const { thread_id, reply_id } = req.body;
      console.log(`PUT /api/replies/:board called to report reply with thread_id: ${thread_id}, reply_id: ${reply_id}`);

      const thread = threads.find(thread => thread._id === thread_id);
      if (!thread) {
        console.log('Thread not found for reply reporting');
        return res.status(404).send('Thread not found');
      }

      const reply = thread.replies.find(reply => reply._id === reply_id);
      if (!reply) {
        console.log('Reply not found for reporting');
        return res.status(404).send('Reply not found');
      }

      reply.reported = true;
      console.log('Reply successfully reported');
      res.send('reported');
    });
};
