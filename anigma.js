/**
 * Copyright (c) 2010, Benjamin C. Meyer <ben@meyerhome.net>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the author nor the names of its contributors
 *    may be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE REGENTS AND CONTRIBUTORS ``AS IS'' AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED.  IN NO EVENT SHALL THE REGENTS OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 * OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 */

function logg(string)
{
     log.innerHTML = log.innerHTML + ' ' +string + '<br>';
}

function getCookie(cookieName)
{
    if (document.cookie.length <= 0) {
        return '';
    }

    var cookieStart = document.cookie.indexOf(cookieName + '=');
    if (cookieStart === -1) {
        return -1;
    }

    cookieStart = cookieStart + cookieName.length + 1;
    var cookieEnd = document.cookie.indexOf(';', cookieStart);
    if (cookieEnd === -1) {
        cookieEnd = document.cookie.length;
    }
    return unescape(document.cookie.substring(cookieStart, cookieEnd));
}

function restartGame()
{
    var credits = document.getElementById('credits');
    credits.style.display = 'none';
    currentLevel = 1;
    loadLevel();
}

function showCredits() {
    var credits = document.getElementById('credits');

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open('GET', 'credits.html', false);
    xmlhttp.send(null);
    credits.innerHTML = xmlhttp.responseText;
    credits.style.top = document.body.clientHeight;
    credits.style.display = 'block';
    credits.style.webkitTransitionProperty = 'top';
    var height = window.getComputedStyle(credits, null).height;
    credits.style.top = '-' + height;
}

function showMessageBox(message)
{
    var messageBox = document.getElementById('messagebox');
    messageBox.innerHTML = message;
    messageBox.style.top = '0';
    messageBox.style.opacity = 0.8;
}

function checkForTransitionSupport()
{
    var cssTransitionsSupported = false;
    var div = document.createElement('div');
    div.innerHTML = '<div style="-webkit-transition:color 1s linear;-o-transition:color 1s linear;-moz-transition:color 1s linear;"></div>';
    cssTransitionsSupported =
        (div.firstChild.style.webkitTransition !== undefined)
        || (div.firstChild.style.oTransition !== undefined)
        || (div.firstChild.style.MozTransition !== undefined);
    delete div;
    if (!cssTransitionsSupported) {
        showMessageBox('Sorry, Anigma requires a WebKit browser such as <a href="http://www.apple.com/safari/">Safari</a>, <a href="http://www.google.com/chrome">Chrome</a>, or <a href="http://arora-browser.org">Arora</a><small>  (Firefox Nightly & Opera Beta mostly work)</small>');
    }
}

function changeScore(amount)
{
    score += amount;
    if (score <= 1024)
        scoreDisplay.style.width = score;
    else
        scoreDisplay.style.width = 1024;
    /*if (score < 0 && amount < 0) {
        showMessageBox('Game Over!');
    }*/
}

function checkLevel()
{
    if (levelCompleted === true) {
        return;
    }

    for (var i = 0; i < board.childNodes.length; ++i) {
        var node = board.childNodes[i];
        if (node.className !== 'gameobject') {
            continue;
        }
        switch (node.id) {
        case 'B':
        case 'Y':
        case 'A':
        case 'H':
        case 'E':
        case 'G':
        case 'P':
        case 'R':
            return;
        }
    }

    levelCompleted = true;
    clock.style.backgroundColor = 'white';
    ++currentLevel;
    var expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 365);
    document.cookie = 'level=' + escape(currentLevel) + ';expires=' + expirationDate.toGMTString();
    document.cookie = 'score=' + escape(score) + ';expires=' + expirationDate.toGMTString();
    document.cookie = 'levelLog=' + escape(levelLog) + ';expires=' + expirationDate.toGMTString();

    if (currentLevel >= totalLevels) {
        showCredits();
    } else {
        // At the end of this animation loadLevel will be called.
        endLevelAnimation();
    }
}

function outOfTime()
{
    if (levelCompleted) {
        return;
    }
    showMessageBox('Out of Time!');
    changeScore(-10);
}

function selectJewel(node)
{
    if (document.getElementById('messagebox').style.opacity != '0') {
        return;
    }

    if (!node || node.id === 'W') {
        return;
    }
    cursor.selectedElement = node;
    cursor.selected = true;
    cursor.style.backgroundImage = 'url("png/cursor_selected.png")';
    cursor.style.left = node.style.left;
    cursor.style.top = node.style.top;
    logPlayerActions(node);
}

function toggleSelection()
{
    if (cursor.selected) {
        cursor.selected = false;
        cursor.selectedElement = NaN;
        cursor.style.backgroundImage = 'url("png/cursor_unselected.png")';
    } else {
        var node = getGameElementAt(nodeLeft(cursor), nodeTop(cursor));
        // don't select jewels that are being removed
        if (node && !node.removing) {
            selectJewel(node);
        }
    }
}

function animateRemovalDone(event)
{
    changeScore(1);
    if (this === cursor.selectedElement) {
        toggleSelection();
    }
    this.parentNode.removeChild(this);
    setTimeout(checkLevel, 1000);
    checkGravity();
    checkLevel();
}

function removeJewel(node)
{
    if (node && node === cursor.selectedElement) {
        toggleSelection();
    }

    node.removeEventListener('webkitTransitionEnd', movementTransitionDone, false);
    node.removeEventListener('transitionend', movementTransitionDone, false);
    node.removeEventListener('oTransitionEnd', movementTransitionDone, false);
    node.addEventListener('webkitTransitionEnd', animateRemovalDone, false);
    node.addEventListener('transitionend', animateRemovalDone, false);
    node.addEventListener('oTransitionEnd', animateRemovalDone, false);
    node.style.opacity = 0;
    node.removing = true;
}

function checkGravityOnNode(node)
{
    var x = nodeLeft(node);
    var y = nodeTop(node);
    var bNode = getGameElementAt(x, y + size);
    if (bNode.id === 'C') {
        // sadly the currently release safari doesn't support pausing
        // and I can't figure out a way to pause.
        bNode.style.webkitAnimationIterationCount = 1;
        bNode.style.webkitAnimationName = 'crumbleAnimation';
        bNode.style.webkitAnimationPlayState = 'running';
        node.crumbling = bNode;
    }

    if (bNode.id === 'T' && bNode.closed !== true) {
        bNode.closed = true;
        bNode.style.backgroundPosition = '0';
        bNode = NaN;
    }

    if (bNode.id === 'F' && bNode.beingPutOut !== true) {
        bNode.beingPutOut = true;
        //node.addEventListener('webkitTransitionEnd', function() { bNode.id = 'W'; }, false);
        removeJewel(node);
        bNode.id = 'W';
        bNode.style.webkitBackgroundSize = size + 'px ' + size + 'px';
        bNode.style.MozBackgroundSize = size + 'px ' + size + 'px';
        bNode = NaN;
    }

    if (bNode.id === 'M') {
        if (moveOnElevator(node, nodeLeft(node), nodeTop(node))) {
            return;
        }
        bNode = NaN;
    }

    if (!bNode) {
        if (nodeTop(node) + size > parseInt(board.style.height.split('px')[0], 10)) {
            removeJewel(node);
            return false;
        } else {
            node.style.top = nodeTop(node) + size;
            if (node && node === cursor.selectedElement) {
                cursor.style.top = nodeTop(cursor) + size;
            }
        }
        return true;
    }
    return false;
}

function checkGravity()
{
    for (var i = board.childNodes.length - 1; i >= 0; --i) {
        var node = board.childNodes[i];
        switch (node.id) {
        case 'B':
        case 'Y':
        case 'G':
        case 'P':
        case 'R':
        case 'A':
        case 'H':
        case 'E':
            checkGravityOnNode(node);
            break;
        }
    }
}

function itemAnimationEnd()
{
    this.parentNode.removeChild(this);
    checkGravity();
}

function logPlayerActions(node)
{
    levelLog += nodeLeft(node) + ' ' + nodeTop(node) + ' ';
    levelLog += (new Date().getTime()) - logtimestart + '\n';
    levelLogDisplay.value = levelLog;
}

function nodeTop(node)
{
    return parseInt((node.style.top.split('px')[0]), 10);
}

function nodeLeft(node)
{
    return parseInt((node.style.left.split('px')[0]), 10);
}

function getGameElementAt(x, y)
{
    for (var i = 0; i < board.childNodes.length; ++i) {
        var node = board.childNodes[i];
        if (node.className !== 'gameobject') {
            continue;
        }
        if(node.id === 'cursor') {
            continue;
        }

        // Elevators have special properties
        if (node.id === 'M' && x === node.style.posLeft) {
            var my = parseInt(window.getComputedStyle(node, null).posTop.split('px')[0], 10);
            if (y + size + size > my && y < my) {
                return node;
            }
        } else {
            if (nodeLeft(node) === x && nodeTop(node) === y) {
                return node;
            }
        }
    }
    return NaN;
}

function checkElement(node)
{
    if (node.removing)
        return;

    if (checkGravityOnNode(node)) {
        checkGravity();
        return;
    }

    var x = nodeLeft(node);
    var y = nodeTop(node);
    var removed = false;

    var bNode = getGameElementAt(x, y + size);
    if (bNode && bNode.id === node.id && !bNode.removing) {
        removeJewel(bNode);
        removed = true;
    }

    if (!bNode) {
        checkGravity();
        return;
    }

    var leftNode = getGameElementAt(x - size, y);
    if (leftNode && leftNode.id === node.id && !leftNode.removing) {
        removeJewel(leftNode);
        removed = true;
    }

    var rNode = getGameElementAt(x + size, y);
    if (rNode && rNode.id === node.id && !rNode.removing) {
        removeJewel(rNode);
        removed = true;
    }

    if (removed) {
        removeJewel(node);
    } else {
        checkGravity();
    }
}

function clickedOnJewel(event)
{
    selectJewel(this);
    event.cancelBubble = true;
}

function movementTransitionDone()
{
    checkElement(this);
}

function swap_mover()
{
    if (levelCompleted) {
        return;
    }
    if (this.direction) {
        this.style.top = this.startAnimationY;
    } else {
        this.style.top = this.endAnimationY;
    }
    this.direction = !this.direction;
}

function moveOffElevator(jewel, x, y)
{
    // not implemented
    return false;

    // Check if we were on a
    if (jewel.onTopElevator) {
        jewel.onTopElevator = false;

        var mover = jewel.parentNode;
        var jewelY = parseInt(window.getComputedStyle(jewel, null).top.split('px')[0], 10) + nodeTop(mover);
        jewel.parentNode.removeChild(jewel);
        jewel.style.top = (jewelY - (jewelY % size));
        board.appendChild(jewel);
        mover.endAnimationY -= size;
        mover.style.top = mover.endAnimationY;

        jewel.style.posLeft += x;
        checkElement(jewel);
        return true;
    }
    if (jewel.underElevator) {
        jewel.underElevator = false;

        jewel.underElevator.startAnimationY += size;
        jewel.underElevator.style.top = jewel.underElevator.startAnimationY;

        jewel.style.posLeft += x;
        checkElement(jewel);
        return true;
    }
    return false;
}

function moveOnElevator(jewel, x, y)
{
    // not implemented
    return false;
    for (var i = 0; i < board.childNodes.length; ++i) {
        var node = board.childNodes[i];
        if (node.id !== 'M') {
            continue;
        }

        if (node.style.posLeft != x) {
            continue;
        }
        if (y <= node.startAnimationY && y >=  node.endAnimationY) {
            var moverY = parseInt(window.getComputedStyle(node, null).top.split('px')[0], 10);
            if (moverY > y) {
                // box is above
                jewel.parentNode.removeChild(jewel);
                node.appendChild(jewel);
                jewel.style.lft = 0;
                jewel.style.top = -size;
                node.endAnimationY += size;
                jewel.onTopElevator = true;
                checkElement(jewel);
                return true;
            } else {
                // box is below
                node.startAnimationY -= size;
                jewel.underElevator = node;
                checkElement(jewel);
                return false;
            }
        }
    }
    return false;
}

function moveSelection(x, y)
{
    if (document.getElementById('messagebox').style.opacity != '0') {
        return;
    }

    var allow = true;
    var newx = nodeLeft(cursor) + x;
    var newy = nodeTop(cursor) + y;
    // Can't move off the board
    if (newx < 0 || newy < 0 || newx > board.style.width || newy > board.style.height.split('px')[0]) {
        return;
    }

    if (cursor.selected) {
        // Can't move up, only down
        if (y < 0) {
            return;
        }

        var node = getGameElementAt(newx, newy);
        if (node) {
            return;
        }
    }

    cursor.style.left = newx;
    cursor.style.top = newy;
    if (cursor.selected) {
        var selectedNode = cursor.selectedElement;
        if (selectedNode.crumbling) {
            var cblock = selectedNode.crumbling;
            var offset = window.getComputedStyle(cblock, null).backgroundPosition;
            selectedNode.crumbling.style.webkitAnimationName = 'none';
            cblock.style.backgroundPosition = offset;
            cblock.style.webkitAnimationPlayState = 'paused';
            selectedNode.crumbling = NaN;
        }
        if (!moveOffElevator(selectedNode, x, y)) {
            if (!moveOnElevator(selectedNode, newx, newy)) {
                selectedNode.style.left = nodeLeft(selectedNode) + x;
                selectedNode.style.top = nodeTop(selectedNode) + y;
            }
        }
        logPlayerActions(selectedNode);
    }
}

function getAbsolutePosition(element) {
    var r = { x: element.offsetLeft, y: element.offsetTop };
    if (element.offsetParent) {
      var tmp = getAbsolutePosition(element.offsetParent);
      r.x += tmp.x;
      r.y += tmp.y;
    }
    return r;
  };

function clickedOnBoard(event)
{
    if (!cursor) {
        return;
    }
    var node = cursor.selectedElement;
    if (!node) {
        return;
    }
    var abp = getAbsolutePosition(node);
    if (event.clientX < abp.x) {
        moveSelection(-size, 0);
        return;
    }
    if (event.clientX > (abp.x + parseInt(node.style.width, 10))) {
        moveSelection(size, 0);
    }
}

function loadLevelFile(level)
{
    document.getElementById('levelEditor').value = level;

    var dialog = document.getElementById('messagebox');
    dialog.style.opacity = 0;
    dialog.style.top = '-14em';

    levelDisplay.innerHTML = '#' + currentLevel;///<small><small>' + totalLevels + '</small></small>';
    logtimestart = new Date().getTime();
    levelLog = '';

    var index = 0;
    while (index < board.childNodes.length) {
        if (board.childNodes[index].className === 'gameobject') {
            board.removeChild(board.childNodes[index]);
        } else {
            ++index;
        }
    }

    cursor = document.createElement('div');
    cursor.addEventListener('click', function() { toggleSelection(); }, false);
    cursor.className = 'gameobject';
    cursor.id = 'cursor';
    cursor.style.width = size;
    cursor.style.height = size;
    board.appendChild(cursor);
    cursor.style.webkitBackgroundSize = size + 'px ' + size + 'px';
    cursor.style.MozBackgroundSize = size + 'px ' + size + 'px';
    cursor.style.top = 0;
    cursor.style.left = 0;

    // init the cursor as unselected
    cursor.selected = true;
    toggleSelection();

    var rows = level.split('\n');
    var height = size * (rows.length - 2);
    if (height <= 0) {
        if (currentLevel != 1) {
            currentLevel = 1;
            loadLevel();
        } else {
            showMessageBox('Error Loading Level: ' + currentLevel + ', sorry.');
        }
        return;
    }

    if (height > 25 * size) {
        // massive failure of the unknown type, level isn't actually a level file?
        showMessageBox('Error Loading Level: ' + currentLevel + ', sorry.');
        return false;
    }
    board.style.height = height;
    board.style.marginTop = (10 * size) - (height);
    var width;
    for (var i = 0; i < rows.length -1; ++i) {
        var row = rows[i + 1];
        for (var j = 0; j < row.length; ++j) {
            width = size * row.length;
            if (row[j] === '.') {
                if (cursor.style.top == "0px") {
                    cursor.style.top = i * size;
                    cursor.style.left = j * size;
                }
                continue;
            }

            var item = document.createElement('div');
            item.className = 'gameobject';
            item.id = row[j];

            switch(row[j]) {
            case 'C':
                item.addEventListener('webkitAnimationEnd', itemAnimationEnd, false);
                item.addEventListener('animationend', itemAnimationEnd, false);
                break;

            case 'F':
                item.style.webkitBackgroundSize = 10 * size + 'px ' + size + 'px';
                item.style.MozBackgroundSize = 10 * size + 'px ' + size + 'px';
                break;

            case 'W':
                break;

            // Jewels
            case 'B':
            case 'R':
            case 'Y':
            case 'G':
            case 'P':
            case 'A':
            case 'H':
            case 'E':
                switch(item.id) {
                case 'B':
                    item.style.backgroundImage = 'url("png/jewel_blue.png")'; break;
                case 'R':
                    item.style.backgroundImage = 'url("png/jewel_red.png")'; break;
                case 'Y':
                    item.style.backgroundImage = 'url("png/jewel_yellow.png")'; break;
                case 'G':
                    item.style.backgroundImage = 'url("png/jewel_green.png")'; break;
                case 'P':
                    item.style.backgroundImage = 'url("png/jewel_orange.png")'; break;
                case 'A':
                    item.style.backgroundImage = 'url("png/jewel_white.png")'; break;
                case 'H':
                    item.style.backgroundImage = 'url("png/jewel_cyan.png")'; break;
                case 'E':
                    item.style.backgroundImage = 'url("png/jewel_gray.png")'; break;
                }
                item.addEventListener('webkitTransitionEnd', movementTransitionDone, false);
                item.addEventListener('transitionend', movementTransitionDone, false);
                item.addEventListener('oTransitionEnd', movementTransitionDone, false);
                item.addEventListener('click', clickedOnJewel, false);
                item.style.webkitBackgroundSize = size + 'px ' + size + 'px';
                item.style.MozBackgroundSize = size + 'px ' + size + 'px';
                item.style.backgroundSize = size + 'px ' + size + 'px';
                break;

            case 'T':
                item.style.webkitBackgroundSize = size + 'px ' + size + 'px';
                item.closed = false;
                item.addEventListener('webkitTransitionEnd', function() { this.id = 'W'; }, false);
                item.addEventListener('transitionend', function() { this.id = 'W'; }, false);
                item.addEventListener('oTransitionEnd', function() { this.id = 'W'; }, false);
                break;

            case 'M':
                // Levels with elevators are currently not supported
                //currentLevel++;
                //loadLevel();
                //return;
                item.startAnimationY = i;
                item.endAnimationY = parseInt(row[j+3] + row[j+4], 10);
                var diff = item.startAnimationY - item.endAnimationY;
                item.style.webkitTransitionDuration = diff / 2 + 's';
                item.startAnimationY = size * i;
                item.endAnimationY = size * parseInt(row[j+3] + row[j+4], 10);

                var first = row.substring(0, j);
                var second = row.substring(j + 4);
                row = first + second;
                item.style.top = item.startAnimationY;
                item.addEventListener('webkitTransitionEnd', swap_mover, false);
                item.direction = true;
                break;

            default:
                item.innerHTML = row[j];
                break;
            }

            board.appendChild(item);

            item.style.top = i * size;
            item.style.left = j * size;
            item.style.width = size;
            item.style.height = size;

        }
    }

    board.style.width = width;
    clock.time = parseInt(rows[0].split('-')[3], 10) * 4;
    if (clock.time < 45) {
        clock.time = 45;
    }

    // turnoff the duration
    clock.style.webkitTransitionDuration = '0';
    clock.style.MozTransitionDuration = '0';
    clock.style.oTransitionDuration = '0';

    // reset bg color and width
    clock.style.backgroundColor = 'white';
    clock.style.width = '100%';

    // force rendering engine to set width/color
    window.getComputedStyle(clock, null).width;

    // turn back on duration
    clock.style.webkitTransitionDuration = clock.time + 's';
    clock.style.MozTransitionDuration = clock.time + 's';
    clock.style.oTransitionDuration = clock.time + 's';

    // start animating to 0
    clock.style.backgroundColor = 'red';
    clock.style.width = '0%';

    checkGravity();
    levelCompleted = false;
}

function loadLevel()
{
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4) {
            if (xmlhttp.status !== 200 && xmlhttp.status !== 0) {
                currentLevel = 1;
                loadLevel();
            } else {
                loadLevelFile(xmlhttp.responseText);
            }
        }
    };
    xmlhttp.open('POST', 'levels/' + currentLevel + '.level', true);
    xmlhttp.send(levelLog);
}

function restartLevel()
{
    if (document.getElementById('debug').style.display !== 'none') {
        var input = document.getElementById('level');
        currentLevel = input.value;
    }

    changeScore(-10);
    loadLevel();
}

function playBackgroundAudio()
{
    var audio = document.getElementById('audio');
    if (!audio || !audio.pause) {
        return;
    }
    audio.pause();
    audio.currentSong += 1;
    if (audio.currentSong > 10) {
        audio.currentSong = 0;
    }
    switch(audio.currentSong) {
    case 0: audio.setAttribute('src', 'audio/aftershocksunrise.mp3'); break;
    case 1: audio.setAttribute('src', 'audio/All Systems Go.mp3'); break;
    case 2: audio.setAttribute('src', 'audio/nullsleep_-_her_lazer_light_eyes.mp3'); break;
    case 3: audio.setAttribute('src', 'audio/first.mp3'); break;
    case 4: audio.setAttribute('src', 'audio/Solo City.mp3'); break;
    case 5: audio.setAttribute('src', 'audio/Alpha_C_-_Neon_Aurora.mp3'); break;
    case 6: audio.setAttribute('src', 'audio/Siddhis - Wine Walls.mp3'); break;
    case 7: audio.setAttribute('src', 'audio/FantomenK - Tiny Tunes.mp3'); break;
    case 8: audio.setAttribute('src', 'audio/The Blackbird.mp3'); break;
    case 9: audio.setAttribute('src', 'audio/Reflect 2.mp3'); break;
    case 10: audio.setAttribute('src', 'audio/04 Without You.mp3'); break;
    }
    audio.load();
    audio.play();
}

function endLevelAnimation()
{
    var completedAnimation = document.getElementById('finishedlevelanimation');

    switch(Math.floor(Math.random() * 8)) {
    case 0: completedAnimation.style.backgroundImage = 'url("png/jewel_yellow.png")'; break;
    case 1: completedAnimation.style.backgroundImage = 'url("png/jewel_orange.png")'; break;
    case 2: completedAnimation.style.backgroundImage = 'url("png/jewel_blue.png")'; break;
    case 3: completedAnimation.style.backgroundImage = 'url("png/jewel_green.png")'; break;
    case 4: completedAnimation.style.backgroundImage = 'url("png/jewel_red.png")'; break;
    case 5: completedAnimation.style.backgroundImage = 'url("png/jewel_white.png")'; break;
    case 6: completedAnimation.style.backgroundImage = 'url("png/jewel_cyan.png")'; break;
    case 7: completedAnimation.style.backgroundImage = 'url("png/jewel_gray.png")'; break;
    }

    completedAnimation.style.top = Math.floor(Math.random() * document.body.clientHeight);
    if (completedAnimation.direction === 0) {
        completedAnimation.direction = 1;
        completedAnimation.style.left = document.body.clientWidth;
        completedAnimation.style.webkitTransform = 'rotate(360deg)';
        completedAnimation.style.MozTransform = 'rotate(360deg)';
        completedAnimation.style.oTransform = 'rotate(360deg)';
    } else {
        completedAnimation.direction = 0;
        completedAnimation.style.left = -50;
        completedAnimation.style.webkitTransform = 'rotate(-360deg)';
        completedAnimation.style.MozTransform = 'rotate(-360deg)';
        completedAnimation.style.oTransform = 'rotate(-360deg)';
    }
}

function keyUpEvent(event)
{
    switch(event.keyCode)
    {
    case 32: // spacebar
        toggleSelection();
        break;

    case 65: // a
    case 37: // left arrow
        moveSelection(-size, 0);
        break;

    case 68: // d
    case 39: // right arrow
        moveSelection(size, 0);
        break;

    case 83: // s
    case 40: // down arrow
        moveSelection(0, size);
        break;

    case 87: // w
    case 38: // up arrow
        moveSelection(0, -size);
        break;

    case 13: // enter
        restartLevel();
        break;

    case 69: // e
        var box = document.getElementById('editor');
        box.style.display = 'block';
        break;

    // Show the debug form
    case 75: // k
        var debugbox = document.getElementById('debug');
        if (debugbox.style.display === 'block') {
            debugbox.style.display = 'none';
        } else {
            debugbox.style.display = 'block';
        }
        break;
    }
}

function loadGame()
{
    totalLevels = 573;
    if (document.body.clientWidth < 400) {
        var extra = document.getElementById('extra_bg');
        extra.style.display = 'none';
        var gamebox = document.getElementById('game');
        gamebox.style.marginTop = 0;
    }

    checkForTransitionSupport();

    score = 0;
    size = 40;
    document.onkeyup = keyUpEvent;
    scoreDisplay = document.getElementById('score');
    log = document.getElementById('log');
    levelLogDisplay = document.getElementById('levellog');
    levelDisplay = document.getElementById('currentLevel');
    board = document.getElementById('board');
    board.addEventListener('click', clickedOnBoard, false);
    cursor = document.getElementById('cursor');
    document.getElementById('debug').style.display = 'none';

    clock = document.getElementById('clock');
    clock.addEventListener('webkitTransitionEnd', outOfTime, false);
    clock.addEventListener('oTransitionEnd', outOfTime, false);
    clock.addEventListener('transitionend', outOfTime, false);

    var credits = document.getElementById('credits');
    credits.addEventListener('webkitTransitionEnd', restartGame, false);

    var completedNode = document.getElementById('finishedlevelanimation');
    completedNode.addEventListener('webkitTransitionEnd', loadLevel, false);
    completedNode.addEventListener('transitionend', loadLevel, false);
    completedNode.addEventListener('oTransitionEnd', loadLevel, false);
    completedNode.direction = 0;

    currentLevel = parseInt(getCookie('level'), 10);
    if (isNaN(currentLevel) || currentLevel < 0) {
        currentLevel = 1;
    }
    levelLog = getCookie('levelLog');

    var startingScore = parseInt(getCookie('score'), 10);
    if (isNaN(startingScore) || startingScore <= 0) {
        startingScore = 50;
    }
    changeScore(startingScore);
    playBackgroundAudio();
}

function launch(haveAudio) {
    if (haveAudio) {
        var audio = document.createElement('audio');
        audio.addEventListener('ended', function () { playBackgroundAudio(); }, false );
        audio.id = 'audio';
        document.body.appendChild(audio);
        audio.setAttribute('controls', 'true');
        audio.currentSong = 0;
        playBackgroundAudio();
        audio.volume = 0.2;
    }
    document.getElementById('launchgame').style.display = 'none';
    loadLevel();
}

loadGame();
