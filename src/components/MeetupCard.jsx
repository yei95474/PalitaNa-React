import { campusDay, campusTime, OTHER_SPOT } from '../lib/buyer.js';
import { displayPickupTime } from '../lib/campus.js';

const utcCalendar = (timestamp) => new Date(timestamp).toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z';
const calendarText = (value) => value.replace(/[\\;,\n\r]/g, (character) => character === '\n' ? '\\n' : character === '\r' ? '' : '\\' + character);

function addToCalendar(request) {
    const file = new Blob([[
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PalitaNa//Campus Pickups//EN', 'BEGIN:VEVENT',
        'UID:' + request.id + '@palitana', 'SEQUENCE:' + (request.revision ?? 0), 'DTSTAMP:' + utcCalendar(Date.now()),
        'DTSTART:' + utcCalendar(request.pickup_at), 'DTEND:' + utcCalendar(Date.parse(request.pickup_at) + 15 * 60 * 1000),
        'SUMMARY:' + calendarText('PalitaNa pickup: ' + request.item_name),
        'LOCATION:' + calendarText(request.pickup_spot),
        'DESCRIPTION:' + calendarText(request.seller_reply || ''),
        'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:PalitaNa meetup in 30 minutes', 'TRIGGER:-PT30M', 'END:VALARM',
        'END:VEVENT', 'END:VCALENDAR', '',
    ].join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'palitana-pickup.ics';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export default function MeetupCard({ request, now, isBuyer, onMessage, onSuggest }) {
    const future = Date.parse(request.pickup_at) > now;
    const today = future && campusDay(new Date(request.pickup_at)) === campusDay(now);
    const minutes = Math.ceil((Date.parse(request.pickup_at) - now) / 60000);
    const directions = request.pickup_spot === OTHER_SPOT ? null :
        'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(request.pickup_spot + ', Visayas State University, Baybay, Leyte');

    return <section className="meetup-card" aria-label="Campus Meetup Card">
        <div className="meetup-card-top">
            <h4>Campus Meetup Card</h4>
            {today && <span className="request-status">{minutes <= 60 ? 'In ' + minutes + ' min' : 'Today · ' + campusTime(request.pickup_at)}</span>}
        </div>
        <p className="meetup-spot">{request.pickup_spot === OTHER_SPOT ? 'Public meeting spot' : request.pickup_spot}</p>
        <p><time dateTime={request.pickup_at}>{displayPickupTime(request.pickup_at)}</time></p>
        {request.seller_reply && <p className="listing-description">{request.seller_reply}</p>}
        <div className="draft-actions">
            {directions && <a className="draft-button secondary" href={directions} target="_blank" rel="noreferrer">Directions</a>}
            <button type="button" className="draft-button secondary" onClick={onMessage}>Message {isBuyer ? 'seller' : 'buyer'}</button>
            <button type="button" className="text-link" onClick={onSuggest}>Suggest another time</button>
            {future && <button type="button" className="text-link" onClick={() => addToCalendar(request)}>Add to calendar</button>}
        </div>
    </section>;
}
