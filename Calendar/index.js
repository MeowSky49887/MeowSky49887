const fs = require("fs");
const path = require("path");

require('dotenv').config()

const { google } = require('googleapis');
const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
const sheets = google.sheets({ version: 'v4', auth: apiKey });

const escapeHtml = require('escape-html');

async function readTable() {
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: "1gnluIQLPEA-MHRGjsEBHatTlaEpVCUfD7gIZEvbD3lU",
            range: 'Display!A1:G12',
        });

        const values = res.data.values;

        if (values.length) {
            for (let i = 0; i < values.length; i++) {
                while (values[i].length < 7) {
                    values[i].push('');
                }
            }

            while (values.length < 12) {
                values.push(['', '', '', '', '', '', '']);
            }

            result = [];

            for (let i = 0; i < values.length; i++) {
                if (i % 2 == 0) {
                    result.push([])
                    for (let j = 0; j < values[i].length; j++) {
                        result[i/2].push([values[i][j], values[i+1][j]])
                    }
                }
            }

            return result;
        } else {
            console.warn('No data found.');
        }
    } catch (err) {
        console.error('Error fetching data from Google Sheets:', err);
    }
}

async function readTitle() {
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: "1gnluIQLPEA-MHRGjsEBHatTlaEpVCUfD7gIZEvbD3lU",
            range: 'Settings!C2',
        });

        const values = res.data.values;

        if (values.length) {
            const date = new Date(res.data.values);

            const timeZone = "Asia/Bangkok";
            const locale = "th-TH";
    
            const year = new Intl.DateTimeFormat(locale, { year: "numeric", timeZone }).format(date).replace(/\D/g, "");
            const month = new Intl.DateTimeFormat(locale, { month: "long", timeZone }).format(date);
    
            return `${year} | ${month}`;
        } else {
            console.warn('No data found.');
        }
    } catch (err) {
        console.error('Error fetching data from Google Sheets:', err);
    }
}

async function readArt() {
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: "1gnluIQLPEA-MHRGjsEBHatTlaEpVCUfD7gIZEvbD3lU",
            range: 'Settings!C3',
        });

        const values = res.data.values;

        if (values.length) {    
            return `${res.data.values}`;
        } else {
            console.warn('No data found.');
        }
    } catch (err) {
        console.error('Error fetching data from Google Sheets:', err);
    }
}

async function makeSchedule() {

    let svgTemplate = fs.readFileSync(path.join(__dirname, "calendar.svg"), "utf-8");

    art = await readArt();
    title = await readTitle();
    data = await readTable()

    body = "";

    for (var i = 0; i < data.length; i++) {
        body += "<xhtml:tr>";
        for (var j = 0; j < data[i].length; j++) {
            body += `
                <xhtml:td><xhtml:div>
                <xhtml:span>${escapeHtml(data[i][j][0])}</xhtml:span>
                ${stringIsAValidUrl(data[i][j][1]) ? `<xhtml:img src="${escapeHtml(data[i][j][1])}" alt="Image" style="width:60px; height:60px; border-radius: 16px;"></xhtml:img>` : `<xhtml:p>${escapeHtml(data[i][j][1])}</xhtml:p>`}
                </xhtml:div></xhtml:td>
            `;
        }
        body += "</xhtml:tr>";
    }

    svgTemplate = svgTemplate
        .replaceAll("{{art}}", art)
        .replaceAll("{{title}}", title)
        .replaceAll("{{body}}", body)

    return svgTemplate;
}

const URL = require("url").URL;

const stringIsAValidUrl = (string) => {
    try {
        new URL(string);
        return true;
    } catch (err) {
        return false;
    }
};

const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/images', express.static(path.join(process.cwd(), 'public', 'images')));
app.use('/fonts', express.static(path.join(process.cwd(), 'public', 'fonts')));

app.get("/", async (req, res) => {
    const svg = await makeSchedule();
    res.type("image/svg+xml").send(svg);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
