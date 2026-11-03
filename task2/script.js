$(function () {
  var ICON = { phone: '📱', glasses: '👓', bag: '👜', cup: '☕', crumbs: '🍰' };
  var WORDS = { phone: 'a phone', glasses: 'glasses', bag: 'a bag', cup: 'a cup', crumbs: 'cake crumbs' };
  var CARD_W = 270;

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  var ORIGINAL = clone(ROOMS);            // for the Reset button; ROOMS (from data.js) is the live array

  var flyers = [];                         // running "flight" animations
  var $openCard = null, $openGuest = null; // only one card can be open

  function toMin(t) { var p = t.split(':'); return (+p[0]) * 60 + (+p[1]); }
  function avatarUrl(name) { return 'https://api.dicebear.com/9.x/open-peeps/svg?seed=' + encodeURIComponent(name); }
  function joinWords(a) {
    if (a.length < 2) return a[0] || '';
    return a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  }
  function findRoom(name) {
    var found = null;
    $.each(ROOMS, function (i, r) {
      $.each(r.guests, function (j, g) { if (g.name === name) found = r; });
    });
    return found;
  }
  function roomByName(n) { return $.grep(ROOMS, function (r) { return r.name === n; })[0]; }

  // ---------- guest card (on the page) ----------
  function makeCard(g, room) {
    var classes = ['guest', 'color-' + g.color];
    if (g.aitu) classes.push('aitu');
    $.each(g.things, function (i, t) { classes.push('has-' + t); });

    var $card = $('<div>').addClass(classes.join(' ')).attr({
      'data-name': g.name, 'data-color': g.color, 'data-time': g.time, 'data-min': toMin(g.time),
      'data-aitu': g.aitu, 'data-things': g.things.join(' '), 'data-room': room.name, 'data-floor': room.floor
    });

    var $ring = $('<div class="ring">').append($('<img>').attr({ src: avatarUrl(g.name), alt: g.name }));
    if (g.aitu) $ring.append('<span class="badge" title="AITU student">🎓</span>');
    var icons = $.map(g.things, function (t) { return '<span class="thing">' + ICON[t] + '</span>'; }).join('');

    // .guest-inner is animated by the spotlight / jump; .guest itself by move / sort
    var $inner = $('<div class="guest-inner">').append(
      $ring,
      $('<div class="g-name">').text(g.name),
      $('<div class="g-time">').text('🕒 ' + g.time),
      $('<div class="g-things">').html(icons)
    );
    return $card.append($inner);
  }

  function orderOf(room) {
    var list = room.guests.slice();
    if (room.sorted) list.sort(function (a, b) { return toMin(a.time) - toMin(b.time); });
    return list;
  }

  // ---------- build the page from the array ----------
  function buildParty() {
    $.each(flyers.splice(0), function (i, $d) { $d.stop(true, true); });
    $('#house, #house *').stop(true, true);
    $('.fly').remove();
    var $house = $('#house').empty();
    $.each([2, 1], function (i, f) {
      var $floor = $('<section class="floor">').addClass('floor-' + f).attr('data-floor', f)
        .append($('<div class="floor-label">').text('FLOOR ' + f));
      var $rooms = $('<div class="rooms">');
      $.each(ROOMS, function (j, r) {
        if (r.floor !== f) return;
        var $room = $('<div class="room">').attr({ 'data-room': r.name, 'data-floor': f });
        var $head = $('<div class="room-head">').append(
          $('<h3 class="room-name">').text(r.name),
          $('<button type="button" class="sort-btn">').text(r.sorted ? 'Picture order' : 'Sort by time')
        );
        var $guests = $('<div class="guests">');
        $.each(orderOf(r), function (k, g) { $guests.append(makeCard(g, r)); });
        $rooms.append($room.append($head, $guests));
      });
      $house.append($floor.append($rooms));
    });
  }

  // finish every running move / sort animation, so a new action starts from a clean state
  function settle() {
    $.each(flyers.splice(0), function (i, $d) { $d.stop(true, true); });
    $('.guest').stop(true, true);
  }

  // ---------- the 20 cases (one chain each, searching the page) ----------
  var CASES = [
    { id: 1, title: 'Who is in the hall?',
      run: function () { return $('.room[data-room="Hall"] .guest'); } },
    { id: 2, title: 'Who is dressed in yellow or purple?',
      run: function () { return $('.guest.color-yellow, .guest.color-purple'); } },
    { id: 3, title: 'Which AITU students are upstairs?',
      run: function () { return $('.floor[data-floor="2"] .guest.aitu'); } },
    { id: 4, title: 'Who has glasses or a bag?',
      run: function () { return $('.guest.has-glasses, .guest.has-bag'); } },
    { id: 5, title: 'Who came with nothing at all?',
      run: function () { return $('.guest:not(.has-phone, .has-glasses, .has-bag, .has-cup, .has-crumbs)'); } },
    { id: 6, title: 'Who has a phone but no bag?',
      run: function () { return $('.guest.has-phone:not(.has-bag)'); } },
    { id: 7, title: 'Who arrived between 20:30 and 21:00, both included?',
      run: function () {
        return $('.guest').filter(function () { var m = $(this).data('min'); return m >= 1230 && m <= 1260; });
      } },
    { id: 8, title: 'Who arrived after 21:00 and is not an AITU student?',
      run: function () { return $('.guest:not(.aitu)').filter(function () { return $(this).data('min') > 1260; }); } },
    { id: 9, title: 'Who stands right next to Askar?',
      run: function () {
        return $('.guest[data-name="Askar"]').prev('.guest').add($('.guest[data-name="Askar"]').next('.guest'));
      } },
    { id: 10, title: 'Who stands last in each room?',
      run: function () { return $('.guest:last-child'); } },
    { id: 11, title: 'Who stands third in each room?',
      run: function () { return $('.guest:nth-child(3)'); } },
    { id: 12, title: 'Who stands after Timur in his room?',
      run: function () { return $('.guest[data-name="Timur"]').nextAll('.guest'); } },
    { id: 13, title: 'Who stands right before someone in black?',
      run: function () { return $('.guest.color-black').prev('.guest'); } },
    { id: 14, title: 'In which room is Aruzhan?',
      run: function () { return $('.guest[data-name="Aruzhan"]').closest('.room'); } },
    { id: 15, title: 'Which rooms have fewer than 6 guests?',
      run: function () { return $('.room').filter(function () { return $(this).find('.guest').length < 6; }); } },
    { id: 16, title: 'In which rooms does somebody have a cup, but nobody wears glasses?',
      run: function () { return $('.room:has(.has-cup):not(:has(.has-glasses))'); } },
    { id: 17, title: 'Who came first to each room?',
      run: function () {
        return $('.room').map(function () {
          return $(this).find('.guest').toArray().sort(function (a, b) {
            return $(a).data('min') - $(b).data('min');
          })[0];
        });
      } },
    { id: 18, title: 'Miras arrives (21:20, blue, phone) between Askar and Inkar',
      run: function () {
        return $(makeCard(MIRAS, { name: 'Living room', floor: 1 }))
          .hide().insertAfter('.guest[data-name="Askar"]').fadeIn(800);
      } },
    { id: 19, title: 'Natasha says goodbye and goes home',
      noJump: true,
      run: function () {
        return $('.guest[data-name="Natasha"]').fadeOut(800, function () { $(this).remove(); });
      } },
    { id: 20, title: 'Who took the cake?',
      run: function () {
        return $('.floor[data-floor="1"] .guest.has-crumbs:not(.has-cup)')
          .filter(function () { var m = $(this).data('min'); return m > 1260 && m < 1290; })
          .filter(function () { return $(this).prev().add($(this).next()).filter('.aitu').length > 0; });
      } }
  ];

  // ---------- Effect 1: spotlight ----------
  function spotlight($found, noJump) {
    var $keep = $found.first().hasClass('room') ? $found.find('.guest') : $found;   // room cases keep their guests
    var $all = $('.guest-inner').stop(true, true).css('top', 0);
    var $keepIn = $keep.children('.guest-inner');
    $all.not($keepIn).fadeTo(300, 0.2);
    $keepIn.fadeTo(300, 1);
    if (!noJump) $keepIn.animate({ top: -16 }, 150).animate({ top: 0 }, 150);
  }

  function runCase(c) {
    closeCard();
    settle();
    buildParty();
    $('.case-btn').removeClass('active').filter('[data-case="' + c.id + '"]').addClass('active');

    var $found = c.run();
    var names = $found.map(function () {
      return $(this).hasClass('guest') ? $(this).data('name') : $(this).data('room');
    }).get();

    $found.addClass('found');
    spotlight($found, c.noJump);

    $('#result').html('<strong>Case ' + c.id + ': ' + c.title + '</strong><br>Found ' +
      names.length + ': ' + names.join(', '));
    $('#chain').text(c.run.toString());
  }

  function clearSpotlight() {
    closeCard();
    $('.guest-inner').stop(true, true).css('top', 0).fadeTo(300, 1);
    $('.found').removeClass('found');
    $('.case-btn').removeClass('active');
    $('#result').text('Cleared. Everybody is bright again.');
    $('#chain').empty();
  }

  // ---------- Effect 2: guest card grows from the photo ----------
  function cardTarget($ring, w, h) {
    var o = $ring.offset(), cx = o.left + $ring.outerWidth() / 2;
    var left = Math.max(8, Math.min(cx - w / 2, $(window).width() - w - 8));
    var top = Math.max(8, Math.min(o.top - 10, $(document).height() - h - 8));
    return { left: left, top: top };
  }

  function cardEl($g) {
    var name = $g.attr('data-name'), room = $g.attr('data-room');
    var things = ($g.attr('data-things') || '').split(' ').filter(Boolean);
    var words = $.map(things, function (t) { return WORDS[t]; });

    var $c = $('<div class="guest-card">');
    var $b = $('<div class="card-body">').appendTo($c);
    $b.append($('<div class="card-head">').append(
      $('<img class="card-avatar" alt="">').attr('src', avatarUrl(name)),
      $('<div>').append($('<h4>').text(name),
        $('<div class="muted">').text('In the ' + room.toLowerCase() + ', floor ' + $g.attr('data-floor')))
    ));
    $b.append($('<ul>').append(
      $('<li>').text('Came at ' + $g.attr('data-time')),
      $('<li>').text($g.attr('data-aitu') === 'true' ? 'AITU student' : 'Not an AITU student'),
      $('<li>').text(things.length ? 'Has ' + joinWords(words) : 'Came with nothing'),
      $('<li>').text('Wears ' + $g.attr('data-color'))
    ));
    if (findRoom(name)) {
      var $m = $('<div class="moves">');
      $.each(ROOMS, function (i, r) {
        if (r.name !== room) {
          $m.append($('<button type="button" class="move-btn">')
            .attr({ 'data-name': name, 'data-to': r.name }).text('Move to the ' + r.name.toLowerCase()));
        }
      });
      $b.append($m);
    }
    return $c;
  }

  function openCard($g) {
    if ($openGuest && $openGuest[0] === $g[0]) return;
    closeCard();
    var $ring = $g.find('.ring'), o = $ring.offset(), s = $ring.outerWidth();
    var $card = cardEl($g).css({ visibility: 'hidden', left: 0, top: 0, width: CARD_W, height: 'auto' }).appendTo('body');
    var h = $card.outerHeight(), t = cardTarget($ring, CARD_W, h);
    $card.css({ visibility: 'visible', left: o.left, top: o.top, width: s, height: s, opacity: 0.2 })
      .animate({ left: t.left, top: t.top, width: CARD_W, height: h, opacity: 1 }, 350);
    $openCard = $card;
    $openGuest = $g;
  }

  function closeCard() {
    if (!$openCard) return;
    var $c = $openCard, $g = $openGuest;
    $openCard = null;
    $openGuest = null;
    if ($.contains(document.body, $g[0])) {
      var $ring = $g.find('.ring'), o = $ring.offset(), s = $ring.outerWidth();
      $c.stop(true).animate({ left: o.left, top: o.top, width: s, height: s, opacity: 0 }, 250,
        function () { $(this).remove(); });
    } else {
      $c.stop(true).remove();
    }
  }

  // ---------- Effect 3: move a guest to another room ----------
  function moveGuest(name, toName) {
    settle();
    var from = findRoom(name), to = roomByName(toName);
    if (!from || !to || from === to) return;

    // 1) change the array at once, so the cases find the guest in the new room
    var g = $.grep(from.guests, function (x) { return x.name === name; })[0];
    from.guests.splice($.inArray(g, from.guests), 1);
    to.guests.push(g);

    // 2) animate the page
    var $old = $('.guest[data-name="' + name + '"]');
    var $toGuests = $('.room[data-room="' + toName + '"] .guests');
    var o = $old.offset();

    var $fly = $old.clone().removeClass('guest found').addClass('fly')
      .css({ position: 'absolute', left: o.left, top: o.top, margin: 0, zIndex: 1500 }).appendTo('body');

    var $new = makeCard(g, to);
    $new.children('.guest-inner').css('opacity', $old.children('.guest-inner').css('opacity'));
    $new.css({ width: 0, marginLeft: 0, marginRight: 0, overflow: 'hidden', visibility: 'hidden' })
      .appendTo($toGuests)
      .animate({ width: 72, marginLeft: 3, marginRight: 3 }, 700, function () {
        $(this).css({ width: '', marginLeft: '', marginRight: '', overflow: '' });
      });

    $old.css({ overflow: 'hidden', visibility: 'hidden' })
      .animate({ width: 0, marginLeft: 0, marginRight: 0 }, 700, function () { $(this).remove(); });

    var $d = $({ t: 0 });
    flyers.push($d);
    $d.animate({ t: 1 }, {
      duration: 850,
      step: function (now) {
        var tg = $new.offset();                               // the free place keeps moving while it opens
        $fly.css({
          left: o.left + (tg.left - o.left) * now,
          top: o.top + (tg.top - o.top) * now - Math.sin(Math.PI * now) * 50
        });
      },
      complete: function () { $fly.remove(); $new.css('visibility', ''); }
    });
  }

  // ---------- Effect 4: sort by time / back to picture order ----------
  function toggleSort(roomName) {
    settle();
    var room = roomByName(roomName);
    room.sorted = !room.sorted;

    var $room = $('.room[data-room="' + roomName + '"]');
    var $guests = $room.find('.guests'), $cards = $guests.children('.guest');
    $room.find('.sort-btn').text(room.sorted ? 'Picture order' : 'Sort by time');

    var before = [];
    $cards.each(function () { before.push({ el: this, o: $(this).offset() }); });

    var idx = {};
    $.each(room.guests, function (i, g) { idx[g.name] = i; });
    var list = $cards.toArray().sort(function (a, b) {
      if (room.sorted) return (+$(a).attr('data-min')) - (+$(b).attr('data-min'));
      var na = $(a).attr('data-name'), nb = $(b).attr('data-name');
      return (na in idx ? idx[na] : 999) - (nb in idx ? idx[nb] : 999);
    });
    $.each(list, function (i, el) { $guests.append(el); });

    $.each(before, function (i, b) {
      var n = $(b.el).offset();
      $(b.el).css({ left: b.o.left - n.left, top: b.o.top - n.top }).animate({ left: 0, top: 0 }, 600);
    });
  }

  // ---------- events ----------
  $.each(CASES, function (i, c) {
    $('<button type="button" class="case-btn">').attr({ 'data-case': c.id, title: c.title })
      .text('Case ' + c.id).appendTo('#cases');
  });
  $('<button type="button" class="tool-btn" id="clear">Clear</button>').appendTo('#cases');
  $('<button type="button" class="tool-btn" id="reset">Reset party</button>').appendTo('#cases');

  $('#cases').on('click', '.case-btn', function () {
    var id = +$(this).attr('data-case');
    runCase($.grep(CASES, function (c) { return c.id === id; })[0]);
  });
  $('#clear').on('click', clearSpotlight);
  $('#reset').on('click', function () {
    closeCard();
    settle();
    ROOMS = clone(ORIGINAL);
    buildParty();
    $('.case-btn').removeClass('active');
    $('#result').text('Party reset to the picture.');
    $('#chain').empty();
  });

  $('#house').on('click', '.sort-btn', function () { toggleSort($(this).closest('.room').attr('data-room')); });
  $(document).on('click', '.move-btn', function () {
    var name = $(this).attr('data-name'), to = $(this).attr('data-to');
    closeCard();
    moveGuest(name, to);
  });

  // click a guest -> open card; click anywhere else -> close it
  $(document).on('click', function (e) {
    var $t = $(e.target);
    if ($t.closest('.guest-card').length) return;
    var $g = $t.closest('.guest');
    if ($g.length && $g.closest('#house').length) openCard($g); else closeCard();
  });
  $(document).on('keydown', function (e) { if (e.key === 'Escape') closeCard(); });

  buildParty();
});