// @author Arcticoid
//

'use strict';

(function (angular) {
    'use strict';

    const arctic = angular.module('arctic', []);

    arctic
        .directive('arcticAutocomplete',['$http', '$compile',arcticAutocomplete])
        .directive('arcticSelect',[arcticSelect])
        .directive('arcticHover',[arcticHover]);



    function arcticAutocomplete($http, $compile) {
        return {
            restrict: 'A',
            scope: {
                arcticUrl : '@',
                arcticMask : '@',
                arcticMaskSecondary : '@',
                arcticPlaceholder : '@',
                arcticMaxHeight : '@',
                arcticData : '=',
                arcticLocal : '@',
                arcticModel : '=',
            },
            link: function (scope, elem, attrs) {
                const parent = angular.element(elem[0].parentNode)[0];
                const wrap =  document.createElement('div');
                wrap.className = 'arctic-list-wrap';
                wrap.style.visibility = 'hidden';
                parent.appendChild(wrap);

                elem[0].placeholder = scope.arcticPlaceholder ? scope.arcticPlaceholder : 'Start typing ...';

                elem[0].onkeyup = function () {
                    request();
                };
                elem[0].onfocus = function () {
                    request();
                    resetHeight();
                    // angular.element(elem[0].parentNode).find('label').addClass('active');
                };
                elem[0].onblur = function (e) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    wrap.style.visibility = 'hidden';
                    /* if(!elem[0].value || elem[0].value === '') {
                         angular.element(elem[0].parentNode).find('label').removeClass('active');
                     }*/
                };

                function makeHtml(res) {

                    let html;
                    let ul = document.createElement('ul');
                    wrap.innerHTML = '';

                    if(!res.length) {
                        ul.innerHTML = '<li style="color:#aeacb4; font-style: italic; font-size: 12px"><p>Ничего не найдено</p></li>'

                    } else {
                        if (!scope.arcticMask)  scope.arcticMask = 'name';
                        let mask = scope.arcticMask.split(' ');
                        for(let i=0; i<res.length; i++) {
                            let item = res[i];
                            item['arctic'] = '';
                            for (let i = 0; i < mask.length; i++) {
                                item['arctic'] += item[mask[i]];
                                if (i < mask.length - 1) item['arctic'] += ' ';
                            }
                            if (scope.arcticMaskSecondary) {
                                let secondaryMask = scope.arcticMaskSecondary.split(' ');
                                item['second_arctic'] = '';
                                for (let x = 0; x < secondaryMask.length; x++) {
                                    if(item[secondaryMask[x]])
                                        item['second_arctic'] += item[secondaryMask[x]];
                                    if (x < secondaryMask.length - 1) item['second_arctic'] += ' ';
                                }
                            }

                            let li = document.createElement('li');
                            html = '' +
                                '<p  title="'+item.arctic+'" style="font-size: 14px; margin: 0; padding: 0;">'+item.arctic+'</p>' +
                                (item.second_arctic ? '<p class="secondary" title="'+item.second_arctic+'">'+item.second_arctic+'</p>' : '<p style="height: 0; margin-bottom: 4px;"></p>') +
                                '';

                            li.innerHTML = html;
                            li.addEventListener('mousedown', function () {
                                select(event, item);
                            });
                            li.addEventListener('touchstart', function () {
                                select(event, item);
                            });

                            ul.appendChild(li);
                        }
                    }
                    wrap.appendChild(ul);
                    wrap.style.visibility = 'visible';
                    $compile(parent);
                }

                function request () {
                    if(scope.arcticLocal && scope.arcticData) {
                        makeHtml(search(elem[0].value, scope.arcticData));
                        return false;
                    }
                    $http({
                        method: 'GET',
                        url: "api/v1/" + scope.arcticUrl + '?limit=10&str=' + elem[0].value,
                        headers: {"Content-Type": "application/x-www-form-urlencoded; charset=utf-8"},
                    }).then(function successCallback(data) {
                        let res = data.data.result;
                        makeHtml(res);
                    }, function () {

                    });
                }

                function select (event, item) {
                    if(attrs.arcticModel) {
                        scope.arcticModel = item;
                        scope.$apply();
                    }
                }

                function resetHeight() {
                    let a = document.body.getBoundingClientRect().bottom - elem[0].getBoundingClientRect().bottom - 10,
                        maxHeight = scope.arcticMaxHeight ? scope.arcticMaxHeight : 320;
                    wrap.style.maxHeight = (a<maxHeight ? a : maxHeight) + 'px';
                }

                function search(nameKey, myArray){
                    let newArray = [];
                    for (let i=0; i < myArray.length; i++) {
                        if(myArray[i].name) {
                            if (myArray[i].name.includes(nameKey)) {
                                console.log('found');
                                newArray.push(myArray[i]);
                            }
                        }

                    }
                    return newArray;
                }

            }

        };
    }

    function arcticSelect() {
        return {
            scope: {
                arcticLabel : '@',
                arcticData : '=',
                arcticModel : '=',
                arcticMask : '@',
                arcticMaskSecondary : '@',
                callback : '@'
            },
            restrict: 'E',
            replace: true,
            template: function (scope, elem, attrs) {

                return '<div class="arctic-select arctic-within " ng-class="{\'has-value\' : arcticModel.arctic}">' +
                    '<div class="arctic-select-wrap">' +
                    '<div class="arctic-value-holder">{{arcticModel.arctic ? arcticModel.arctic : \' \'}}</div>' +
                    '<div class="arctic-label">{{arcticLabel}}</div>' +
                    '</div>' +
                    '<div class="arctic-list-wrap">' +
                    '<ul>' +
                    '<li ng-repeat="item in arcticData" ng-click="callback(item)">' +
                    '<p title="{{item.arctic}}">{{item.arctic}}</p>' +
                    '<p title="{{item.second_arctic}}" class="secondary">{{item.second_arctic}}</p>' +
                    '</li>' +
                    '</ul>' +
                    '</div>' +
                    '</div>' +
                    '';
            },
            link: function(scope, elem, attrs) {
                let everywhere = angular.element(window.document);

                scope.callback = function (item) {
                    scope.arcticModel = item;
                };

                scope.$watch('arcticData', function() {
                    scope.arcticData = parseData(scope.arcticData);
                });

                everywhere.bind('click', function(event){
                    let classes = elem[0].className.split(" ");
                    let i = classes.indexOf("active");
                    if (i >= 0) {classes.splice(i, 1)} else {
                        if(elem[0].contains(event.target)) {
                            resetHeight();
                            parseData(scope.arcticData);
                            classes.push("active");
                        }
                    }
                    elem[0].className = classes.join(" ");
                    scope.$apply();
                });

                function parseData(res) {
                    if(!res) return [];
                    if (!scope.arcticMask)  scope.arcticMask = 'name';
                    let mask = scope.arcticMask.split(' ');
                    for(let i=0; i<res.length; i++) {
                        let item = res[i];
                        item['arctic'] = '';
                        for (let i = 0; i < mask.length; i++) {
                            item['arctic'] += item[mask[i]];
                            if (i < mask.length - 1) item['arctic'] += ' ';
                        }
                        if (scope.arcticMaskSecondary) {
                            let secondaryMask = scope.arcticMaskSecondary.split(' ');
                            item['second_arctic'] = '';
                            for (let x = 0; x < secondaryMask.length; x++) {
                                if (item[secondaryMask[x]])
                                    item['second_arctic'] += item[secondaryMask[x]];
                                if (x < secondaryMask.length - 1) item['second_arctic'] += ' ';
                            }
                        }
                    }
                    return res;
                }

                function resetHeight() {
                    let a = document.body.getBoundingClientRect().bottom - elem[0].getBoundingClientRect().bottom - 10,
                        maxHeight = scope.arcticMaxHeight ? scope.arcticMaxHeight : 320;
                    elem[0].childNodes[1].style.maxHeight = (a<maxHeight ? a : maxHeight) + 'px';
                }

            }

        };
    }

    function arcticHover() {
        return {
            scope: {
                arcticPosition : '@',
                arcticMainColor : '@',
                arcticSecondaryColor : '@',
                arcticInverse : '@',
            },
            restrict: 'A',
            link: function(scope, elem, attrs) {
                let a = elem[0],
                    b = document.createElement('div');
                a.className += ' arctic-hover';
                b.className = 'arctic-line';
                if(scope.arcticMainColor) b.style.backgroundColor = scope.arcticMainColor;
                b.innerHTML = '<div class="arctic-line-inner'+(scope.arcticInverse ? ' inverse' : '')+'" '+(scope.arcticSecondaryColor ? ' style="background-color: '+scope.arcticSecondaryColor+'!important"' : '')+'></div>';
                if(scope.arcticPosition === 'bottom' ) {
                    a.appendChild(b);
                } else {
                    a.insertBefore(b, a.firstChild);
                }
            }

        };
    }


})(window.angular);