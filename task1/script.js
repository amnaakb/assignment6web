$(function () {
  var ICON = { phone: '📱', glasses: '👓', bag: '👜', cup: '☕', crumbs: '🍰' };

  function toMin(t) { var p = t.split(':'); return (+p[0]) * 60 + (+p[1]); }
  function avatarUrl(name) { return 'https://api.dicebear.com/9.x/open-peeps/svg?seed=' + encodeURIComponent(name); }

  // ---------- build one guest card from an object ----------
  function makeCard(g, room) {
    var classes = ['guest', 'color-' + g.color];
    if (g.aitu) classes.push('aitu');
    $.each(g.things, function (i, t) { classes.push('has-' + t); });

    var $card = $('<div>').addClass(classes.join(' ')).attr({
      'data-name': g.name,
      'data-color': g.color,
      'data-time': g.time,
      'data-min': toMin(g.time),
      'data-aitu': g.aitu,
      'data-things': g.things.join(' '),
      'data-room': room.name,
      'data-floor': room.floor
    });

    var $ring = $('<div class="ring">').append($('<img>').attr({ src: avatarUrl(g.name), alt: g.name }));
    if (g.aitu) $ring.append('<span class="badge" title="AITU student">🎓</span>');

    var icons = $.map(g.things, function (t) { return '<span class="thing">' + ICON[t] + '</span>'; }).join('');

    return $card.append(
      $ring,
      $('<div class="g-name">').text(g.name),
      $('<div class="g-time">').text('🕒 ' + g.time),
      $('<div class="g-things">').html(icons)
    );
  }

  // ---------- build the whole page from the array ----------
  function buildParty() {
    $('#house, #house *').stop(true, true);
    var $house = $('#house').empty();
    $.each([2, 1], function (i, f) {
      var $floor = $('<section class="floor">').addClass('floor-' + f).attr('data-floor', f)
        .append($('<div class="floor-label">').text('FLOOR ' + f));
      var $rooms = $('<div class="rooms">');
      $.each(ROOMS, function (j, r) {
        if (r.floor !== f) return;
        var $room = $('<div class="room">').attr({ 'data-room': r.name, 'data-floor': f });
        var $guests = $('<div class="guests">');
        $.each(r.guests, function (k, g) { $guests.append(makeCard(g, r)); });
        $rooms.append($room.append($('<h3 class="room-name">').text(r.name), $guests));
      });
      $house.append($floor.append($rooms));
    });
  }

  // ---------- the 20 cases: every case is ONE jQuery chain on the page ----------
  var CASES = [
    { id: 1, title: 'Who is in the hall?',
      run: function () {
        return $('.room[data-room="Hall"] .guest');
      } },
    { id: 2, title: 'Who is dressed in yellow or purple?',
      run: function () {
        return $('.guest.color-yellow, .guest.color-purple');
      } },
    { id: 3, title: 'Which AITU students are upstairs?',
      run: function () {
        return $('.floor[data-floor="2"] .guest.aitu');
      } },
    { id: 4, title: 'Who has glasses or a bag?',
      run: function () {
        return $('.guest.has-glasses, .guest.has-bag');
      } },
    { id: 5, title: 'Who came with nothing at all?',
      run: function () {
        return $('.guest:not(.has-phone, .has-glasses, .has-bag, .has-cup, .has-crumbs)');
      } },
    { id: 6, title: 'Who has a phone but no bag?',
      run: function () {
        return $('.guest.has-phone:not(.has-bag)');
      } },
    { id: 7, title: 'Who arrived between 20:30 and 21:00, both included?',
      run: function () {
        return $('.guest').filter(function () {
          var m = $(this).data('min');
          return m >= 1230 && m <= 1260;
        });
      } },
    { id: 8, title: 'Who arrived after 21:00 and is not an AITU student?',
      run: function () {
        return $('.guest:not(.aitu)').filter(function () {
          return $(this).data('min') > 1260;
        });
      } },
    { id: 9, title: 'Who stands right next to Askar?',
      run: function () {
        return $('.guest[data-name="Askar"]').prev('.guest')
          .add($('.guest[data-name="Askar"]').next('.guest'));
      } },
    { id: 10, title: 'Who stands last in each room?',
      run: function () {
        return $('.guest:last-child');
      } },
    { id: 11, title: 'Who stands third in each room?',
      run: function () {
        return $('.guest:nth-child(3)');
      } },
    { id: 12, title: 'Who stands after Timur in his room?',
      run: function () {
        return $('.guest[data-name="Timur"]').nextAll('.guest');
      } },
    { id: 13, title: 'Who stands right before someone in black?',
      run: function () {
        return $('.guest.color-black').prev('.guest');
      } },
    { id: 14, title: 'In which room is Aruzhan?',
      run: function () {
        return $('.guest[data-name="Aruzhan"]').closest('.room');
      } },
    { id: 15, title: 'Which rooms have fewer than 6 guests?',
      run: function () {
        return $('.room').filter(function () {
          return $(this).find('.guest').length < 6;
        });
      } },
    { id: 16, title: 'In which rooms does somebody have a cup, but nobody wears glasses?',
      run: function () {
        return $('.room:has(.has-cup):not(:has(.has-glasses))');
      } },
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
          .filter(function () {
            var m = $(this).data('min');
            return m > 1260 && m < 1290;
          })
          .filter(function () {
            return $(this).prev().add($(this).next()).filter('.aitu').length > 0;
          });
      } }
  ];

  // ---------- run a case ----------
  function runCase(c) {
    buildParty();
    $('.case-btn').removeClass('active').filter('[data-case="' + c.id + '"]').addClass('active');

    var $found = c.run();

    var names = $found.map(function () {
      return $(this).hasClass('guest') ? $(this).data('name') : $(this).data('room');
    }).get();

    $found.addClass('found');
    if (!c.noJump) $found.animate({ top: -16 }, 150).animate({ top: 0 }, 150);

    $('#result').html('<strong>Case ' + c.id + ': ' + c.title + '</strong><br>Found ' +
      names.length + ': ' + names.join(', '));
    $('#chain').text(c.run.toString());
  }

  // ---------- buttons ----------
  $.each(CASES, function (i, c) {
    $('<button type="button" class="case-btn">').attr({ 'data-case': c.id, title: c.title })
      .text('Case ' + c.id).appendTo('#cases');
  });
  $('#cases').on('click', '.case-btn', function () {
    var id = +$(this).attr('data-case');
    runCase($.grep(CASES, function (c) { return c.id === id; })[0]);
  });

  buildParty();
});