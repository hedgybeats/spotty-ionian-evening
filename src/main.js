import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Dropdown } from 'bootstrap';
import './main.css';
const eventApiEndpoint = 'http://127.0.0.1:3000/event';
let currentEventDropdown = {
  event: null,
  menu: new Dropdown(eventDropdown),
  open: false,
  initialRightClick: false
}

document.addEventListener('DOMContentLoaded', () => {
  const eventDropdown = document.getElementById('eventDropdown');
  var calendarEl = document.getElementById('calendar');

  const showContextMenu = (e, hoverInfo) =>{
      if (e !== null) {
        e.preventDefault();
        console.log(e);
        const rect = e.currentTarget.getBoundingClientRect();
        eventDropdown.parentElement.style.left = `${rect.left + e.offsetX}px`;
        eventDropdown.parentElement.style.top = `${rect.top + e.offsetY}px`;
        currentEventDropdown.menu.show();
        currentEventDropdown.open = true;
        currentEventDropdown.event = hoverInfo.event;
        currentEventDropdown.initialRightClick = true;
    }
  }

  var calendar = new Calendar(calendarEl, {
    plugins: [ interactionPlugin, dayGridPlugin ],
    headerToolbar: {
      left: 'prev,next',
      center: 'title',
      right: 'today'
    },
    initialView: 'dayGridMonth',
    weekends: true,
    editable: true,
    selectable: true,
    selectOverlap: true,
    selectMirror: true,
    dayMaxEvents: true,
    events: (info, success, failure) => {
      fetch(eventApiEndpoint, {
        headers:{
          "content-type":"application/json; charset=UTF-8"
        },method: 'GET'})
        .then(data => data.json())
      .then((res) => {
        calendar.removeAllEvents();
        success(res.data);
      })
      .catch((err) => {
        console.log(err); 
        failure(err)
      });
    },
    select: (selectInfo) => {
      if (currentEventDropdown?.open) {
        currentEventDropdown.menu.hide();
        currentEventDropdown.open = false;
      }
      const title = prompt('Please give this event a title');
      const calendarApi = selectInfo.view.calendar;
      calendarApi.unselect();
      if(title){
        const event = {
          title,
          start: selectInfo.startStr,
          end: selectInfo.endStr,
          allDay: selectInfo.allDay
        }

        fetch(eventApiEndpoint, {
          headers:{
            "content-type":"application/json; charset=UTF-8"
          },
        body: JSON.stringify(event), method: 'POST'})
        .then(data => data.json())
        .then((res) => {
          event.id = res;
          calendarApi.addEvent(event);
        })
        .catch((err) => {console.log(err)});
      }
    },
    eventChange: (changeInfo) => {
      const event = {
        id: changeInfo.event.id,
        title: changeInfo.event.title,
        start:changeInfo.event.startStr ,
        end: changeInfo.event.endStr,
        allDay: changeInfo.event.allDay
      }

      fetch(`${eventApiEndpoint}/${event.id}`, {
        headers:{
          "content-type":"application/json; charset=UTF-8"
        },
      body: JSON.stringify(event), method: 'PUT'})
      .then(data => data.json())
      .then((res) => {
        console.log(res)
      })
      .catch((err) => {console.log(err)});
    },
    eventMouseEnter: (hoverInfo) => {
      const eventMainFrame = hoverInfo.el;
      if (eventMainFrame) {
        eventMainFrame.addEventListener(
          'contextmenu',
          (e) => {
            showContextMenu(e, hoverInfo)
          }
        );
      }
    },
    eventMouseLeave: (hoverInfo) => {
      const eventMainFrame = hoverInfo.el;
      if (eventMainFrame) {
        eventMainFrame.removeEventListener(
          'contextmenu',
          (e) => {
            showContextMenu(e, hoverInfo)
          }
        );
      }
      if (currentEventDropdown.open) {
        return;
      }
      currentEventDropdown.menu.hide();
    },
  });

  let lastKnownScrollPos = 0;
  document.onscroll = () => {
    const newScrollPos = window.scrollY;
    const scrolled = newScrollPos - lastKnownScrollPos;
    lastKnownScrollPos = newScrollPos;
    const oldTop = parseFloat(
      eventDropdown.parentElement.style.top.split('px')[0]
    );
     eventDropdown.parentElement.style.top = `${oldTop - scrolled}px`;
  };

  document.getElementById('deleteEventBtn').addEventListener('click', () => {
    const event = currentEventDropdown.event;
    fetch(`${eventApiEndpoint}/${event.id}`, {
      headers:{
        "content-type":"application/json; charset=UTF-8"
      },
    body: JSON.stringify(event), method: 'DELETE'})
    .then(() => {
      event.remove();
    })
    .catch((err) => {console.log(err)});
  });

  document.getElementById('duplicateEventBtn').addEventListener('click', () => {
    const event = {
      title: currentEventDropdown.event.title,
      start: currentEventDropdown.event.start,
      end: currentEventDropdown.event.end,
      allDay: currentEventDropdown.event.allDay
    }
    fetch(eventApiEndpoint, {
      headers:{
        "content-type":"application/json; charset=UTF-8"
      },
    body: JSON.stringify(event), method: 'POST'})
    .then(() => {
      calendar.addEvent(event);
    })
    .catch((err) => {console.log(err)});
  });

  calendar.render();
});
