const express = require('express');
const app = express();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./docs/schedule.sqlite3', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(err.message);
    return;
  }
  console.log('Connected to the database.');
});

db.run('CREATE TABLE IF NOT EXISTS event ([id] INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, [title] NVARCHAR(100), [start] NVARCHAR(100), [end] NVARCHAR(100), [allDay] BOOLEAN NOT NULL CHECK (allDay IN (0, 1)))');

app.use(express.static(path.resolve(__dirname, 'docs')));

app.use(express.urlencoded({extended: true}));
app.use(express.json())

app.get('/', function (req, res) {
  res.sendFile(path.resolve(__dirname, 'docs/index.html'));
});

// Get all events
app.get('/event', (req, res) => {
  db.all("SELECT id, title, start, end, allDay FROM event", (error, rows) => {
    if (error) {
      handleError(error, res)
      return;
    }
    res.status(200);
    res.json({ data: rows });
    res.end();
  });
});

// Get event by id
app.get('/event/:eventId', (req, res) => {
  const eventId = req.params.eventId;
  db.get("SELECT id, title, start, end, allDay FROM event WHERE id =?", eventId, (error, rows) => {
    if (error) {
      handleError(error, res)
      return;
    }
    res.status(200);
    res.json({ data: rows });
    res.end();
  });
});

// Create event
app.post('/event', (req, res) => {
  const event = {
    title: req.body.title,
    start: req.body.start,
    end: req.body.end,
    allDay: req.body.allDay,
  };

  if(isNullOrUndefined(event.title) ||
  isNullOrUndefined(event.start) ||
  isNullOrUndefined(event.end) ||
  isNullOrUndefined(event.allDay))
{
   handleError({message: 'Missing required fields in event object'}, res)
   return;
}

  db.run(`INSERT INTO event(title, start, end, allDay) VALUES(?,?,?,?)`, 
    [event.title, event.start, event.end, event.allDay],
    (error) => {
      if (error) {
        handleError(error, res)
        return;
      }
      db.get('SELECT id FROM event WHERE id=last_insert_rowid()', (err, latestInsert) => {
        res.status(200);
        res.json({data: latestInsert.id});
        res.end();
      });
    }
);
});

// Update event
app.put('/event/:eventId', (req, res) => {
  const eventId = req.params.eventId;
  const event = {
    id: req.body.id,
    title: req.body.title,
    start: req.body.start,
    end: req.body.end,
    allDay: req.body.allDay,
  };

  console.log(event);

  if(isNullOrUndefined(event.title) ||
    isNullOrUndefined(event.start) ||
    isNullOrUndefined(event.end) ||
    isNullOrUndefined(event.allDay))
    {
      handleError({message: 'Missing required fields in event object'}, res)
      return;
    }

    if(parseInt(eventId, 10) !== parseInt(event.id, 10)){
      handleError({message: 'Event Id query parameter does not match the Id of the passed event object'}, res)
      return;
    }

    const updateInfo = [event.title, event.start, event.end, event.allDay, event.id];

    db.run("UPDATE event SET title=?, start=?, end=?, allDay=? WHERE id =?", updateInfo, (error) => {
      if (error) {
        handleError(error, res)
        return;
      }
      res.status(200);
      res.json(eventId);
      res.end();
    });

});

// Delete event
app.delete('/event/:eventId', (req, res) => {
  const eventId = req.params.eventId;
  db.run("DELETE FROM event WHERE id =?", eventId, (error) => {
    if (error) {
      handleError(error, res)
      return;
    }
    res.status(200);
    res.json(eventId);
    res.end();
  });
});

// const hostname = '127.0.0.1';
// const port = 3000;

// app.listen(port, hostname, () => {
//   console.log(`Server running at http://${hostname}:${port}/`);
// });

app.listen(process.env.PORT, () => {
  console.log('Listening');
});

function handleError(err, res){
  res.status(500);
  res.json({message: err.message});
  res.end();
}

function isNullOrUndefined(obj){
  return (obj === null | obj === undefined);
}