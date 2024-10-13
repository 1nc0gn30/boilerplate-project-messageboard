const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {
  let testThreadId;
  let testReplyId;
  let replyTestThreadId;  // Separate thread ID for replies-related tests

  suite('API ROUTING FOR /api/threads/:board', function () {

    test('Create a new thread', function (done) {
      chai.request(server)
        .post('/api/threads/test')
        .send({ text: 'Test thread', delete_password: '1234' })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isDefined(res.body._id, 'Response should contain thread id');
          testThreadId = res.body._id;  // Save the thread ID for future tests
          done();
        });
    });

    test('View the 10 most recent threads with 3 replies each', function (done) {
      chai.request(server)
        .get('/api/threads/test')
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body, 'Response should be an array of threads');
          assert.isAtMost(res.body.length, 10, 'No more than 10 threads should be displayed');
          done();
        });
    });

    test('Delete a thread with incorrect password', function (done) {
      chai.request(server)
        .delete('/api/threads/test')
        .send({ thread_id: testThreadId, delete_password: 'wrong_password' })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    test('Delete a thread with correct password', function (done) {
      chai.request(server)
        .delete('/api/threads/test')
        .send({ thread_id: testThreadId, delete_password: '1234' })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });

    // Separate thread creation for replies tests (so the thread deletion doesn't affect these tests)
    test('Create a new thread for replies tests', function (done) {
      chai.request(server)
        .post('/api/threads/test')
        .send({ text: 'Reply test thread', delete_password: '1234' })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isDefined(res.body._id, 'Response should contain thread id');
          replyTestThreadId = res.body._id;  // Save the new thread ID for replies-related tests
          done();
        });
    });

    test('Report a thread', function (done) {
      chai.request(server)
        .put('/api/threads/test')
        .send({ thread_id: replyTestThreadId })  // Use the replies test thread ID
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
    });
  });

  suite('API ROUTING FOR /api/replies/:board', function () {

    test('Create a new reply', function (done) {
      chai.request(server)
        .post('/api/replies/test')
        .send({ thread_id: replyTestThreadId, text: 'Test reply', delete_password: '1234' })  // Use the replies test thread ID
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isDefined(res.body.replies, 'Response should contain replies');
          testReplyId = res.body.replies[0]._id;  // Save reply ID for further tests
          done();
        });
    });

    test('View a single thread with all replies', function (done) {
      chai.request(server)
        .get('/api/replies/test?thread_id=' + replyTestThreadId)  // Use the replies test thread ID
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isDefined(res.body.replies, 'Thread should contain replies');
          done();
        });
    });

    test('Delete a reply with incorrect password', function (done) {
      chai.request(server)
        .delete('/api/replies/test')
        .send({ thread_id: replyTestThreadId, reply_id: testReplyId, delete_password: 'wrong_password' })  // Use the replies test thread ID
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    test('Delete a reply with correct password', function (done) {
      chai.request(server)
        .delete('/api/replies/test')
        .send({ thread_id: replyTestThreadId, reply_id: testReplyId, delete_password: '1234' })  // Use the replies test thread ID
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });

    test('Report a reply', function (done) {
      chai.request(server)
        .put('/api/replies/test')
        .send({ thread_id: replyTestThreadId, reply_id: testReplyId })  // Use the replies test thread ID
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
    });
  });
});
