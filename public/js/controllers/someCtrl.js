'use strict';

myApp.controller('someCtrl', function ($scope) {
    this.data = [{ name : 'boat', secondary : 'flying'}, { name : 'bear'}, { name : 'dog'}, { name : 'drink', secondary : 'fresh'}, { name : 'elephant', secondary : 'cute as a hell'}, { name : 'fruit'}];
    this.selected;
});