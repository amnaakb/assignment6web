// Task 1 - the party from the picture (guests from left to right)
var ROOMS = [
  { name: 'Balcony', floor: 2, guests: [
    { name: 'Aigerim', color: 'green',  time: '20:45', aitu: true,  things: ['cup', 'crumbs'] },
    { name: 'Aliya',   color: 'black',  time: '21:15', aitu: false, things: ['phone', 'cup'] },
    { name: 'Madina',  color: 'green',  time: '22:10', aitu: false, things: ['phone', 'bag', 'crumbs'] },
    { name: 'Ivan',    color: 'black',  time: '20:10', aitu: true,  things: ['cup'] }
  ]},
  { name: 'Hall', floor: 2, guests: [
    { name: 'Arman',   color: 'yellow', time: '20:35', aitu: true,  things: ['bag', 'glasses'] },
    { name: 'Sophia',  color: 'purple', time: '21:20', aitu: true,  things: ['phone'] },
    { name: 'Dias',    color: 'green',  time: '19:45', aitu: true,  things: [] },
    { name: 'Bekzat',  color: 'purple', time: '20:55', aitu: false, things: ['bag', 'cup', 'crumbs'] },
    { name: 'Aruzhan', color: 'black',  time: '21:50', aitu: true,  things: ['phone'] },
    { name: 'Saule',   color: 'green',  time: '21:25', aitu: false, things: ['glasses'] }
  ]},
  { name: 'Kitchen', floor: 1, guests: [
    { name: 'Nurlan',  color: 'red',    time: '19:40', aitu: true,  things: ['phone', 'cup'] },
    { name: 'Emma',    color: 'black',  time: '20:15', aitu: false, things: ['bag'] },
    { name: 'Timur',   color: 'green',  time: '21:05', aitu: true,  things: ['phone', 'bag', 'crumbs'] },
    { name: 'Sergey',  color: 'yellow', time: '20:50', aitu: false, things: [] },
    { name: 'Yerlan',  color: 'red',    time: '21:40', aitu: true,  things: ['glasses', 'phone'] },
    { name: 'Kamila',  color: 'black',  time: '20:05', aitu: false, things: ['cup'] }
  ]},
  { name: 'Living room', floor: 1, guests: [
    { name: 'Daniel',  color: 'blue',   time: '19:55', aitu: false, things: ['glasses'] },
    { name: 'Zarina',  color: 'green',  time: '21:10', aitu: false, things: ['bag', 'phone', 'crumbs'] },
    { name: 'Natasha', color: 'yellow', time: '20:30', aitu: true,  things: [] },
    { name: 'Askar',   color: 'black',  time: '21:00', aitu: true,  things: ['phone'] },
    { name: 'Inkar',   color: 'purple', time: '20:20', aitu: false, things: ['bag'] }
  ]}
];

// Guest for case 18
var MIRAS = { name: 'Miras', color: 'blue', time: '21:20', aitu: true, things: ['phone'] };