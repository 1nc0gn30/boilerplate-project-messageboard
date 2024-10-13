const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {

  let testThreadId;
  let testReplyId;

  suite('API ROUTING FOR /api/threads/:board', function () {
    
    test('Create a new thread', function (done) {
      chai.request(server)
        .post('/api/threads/test')
        .send({ text: 'Test thread', delete_password: '1234' })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isDefined(res.body._id, 'Response should contain thread id');
          testThreadId = res.body._id;
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

    test('Report a thread', function (done) {
      chai.request(server)
        .put('/api/threads/test')
        .send({ thread_id: testThreadId })
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
        .send({ thread_id: testThreadId, text: 'Test reply', delete_password: '1234' })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isDefined(res.body.replies, 'Response should contain replies');
          testReplyId = res.body.replies[0]._id;
          done();
        });
    });

    test('View a single thread with all replies', function (done) {
      chai.request(server)
        .get('/api/replies/test?thread_id=' + testThreadId)
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isDefined(res.body.replies, 'Thread should contain replies');
          done();
        });
    });

    test('Delete a reply with incorrect password', function (done) {
      chai.request(server)
        .delete('/api/replies/test')
        .send({ thread_id: testThreadId, reply_id: testReplyId, delete_password: 'wrong_password' })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    test('Delete a reply with correct password', function (done) {
      chai.request(server)
        .delete('/api/replies/test')
        .send({ thread_id: testThreadId, reply_id: testReplyId, delete_password: '1234' })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });

    test('Report a reply', function (done) {
      chai.request(server)
        .put('/api/replies/test')
        .send({ thread_id: testThreadId, reply_id: testReplyId })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
    });
  });
});
