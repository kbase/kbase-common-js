define([
  'bluebird'
], function (Promise) {
    'use strict';
    describe('Promise 1', function () {
      it('Should work 1', function (done) {
        Promise.try(function () {
          return true;
        })
        .then(function (value) {
          expect(value).toBe(true);
          done();
          return null;
        })
        .catch(function (err) {
          done.fail(err);
        });
      });

      it('Should work 2', function (done) {
        Promise.try(function () {
          return true;
        })
        .then(function (value) {
          expect(value).toBe(true);
          done();
          return null;
        })
        .catch(function (err) {
          done.fail(err);
        });
      }); 
    });
})

