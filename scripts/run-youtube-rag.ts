import { connectDB } from '../db/connection.js';
import { processVideos } from '../youtube-rag/pipeline.js';
import mongoose from 'mongoose';

const VIDEO_URLS = [
    'https://www.youtube.com/watch?v=kqtD5dpn9C8',
    "https://youtu.be/g9oECt5ij6Y?si=-A2JoeOESN64PysC",
    "https://youtu.be/ARzt1Kj-494?si=ldFMEJhHp5j27Cqn",
    "https://youtu.be/RsBBRLVOWJo?si=tDql1LrXvyXxV6aO",
    "https://youtu.be/JRlq1gOeqak?si=oZoRp6YW5pdbB3NZ",
    "https://youtu.be/yhnUEgJAEN4?si=HMHfu_5_geoNkiTK",
    "https://youtu.be/hla9Ho07EK8?si=f_PKZDc0Tm2Pye8I",
    "https://youtu.be/BqiwiDRYfVY?si=4LkJxjekGkQCXBAI",
    "https://youtu.be/-wOUsg18-IA?si=qi8tGF8qsS-2CDH-",
    "https://youtu.be/B4UroEdq7k0?si=5V5SKeJTxXeWSPyD",
    "https://youtu.be/mrpiPK8_up0?si=1Ez-FOMnktLDd5b0",
    "https://youtu.be/D69VhdRNok0?si=uRSABPKROAXVlrdz",
    "https://youtu.be/lxibTgibZ0c?si=z8XekMlRK7aNlg3l",
    "https://youtu.be/5VtO5jnxRFk?si=zroKmclKiGXhShbs",
    "https://youtu.be/41GmKAZJUds?si=6U6CgjmCmWCI4Hk3",
    "https://youtu.be/Jot0ya85haI?si=Xa03w-jTr3LzHHpl",
    "https://youtu.be/WlqYhER9Dd8?si=SPuUMMc5gUfyj0ve",
    "https://youtu.be/YMjTktGtVCk?si=_UukxKX-kpTIPFD7",
    "https://youtu.be/JG2N2sdhSGQ?si=aH3klF49VELr43Hq",
    "https://youtu.be/7UmXL6OR6SI?si=CT39TF7-wowAns3r",
    "https://youtu.be/_6gcdQQTXa8?si=9T7i_sszCHjFzyXF",
    "https://youtu.be/ZC-2SLTEnrs?si=LIRwRtcsB6RAT0-D",
    "https://youtu.be/IiLmHwfx6e4?si=6rlnY22BH_y3OEmj",
    "https://youtu.be/a_r4AJJ-ktU?si=PUe7yCYlcl0oHJD9",
    "https://youtu.be/laSEsTLyMjk?si=OWdpnom0RQz_YcLX",
    "https://youtu.be/_ddxEjBm__0?si=bS5lN3pX08HNIfJv",
    "https://youtu.be/PREK0tEazlE?si=l_oxpK41_ttBYUFU"

    // Python for Beginners (Mosh)
];

function extractVideoId(url: string): string | null {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length == 11) ? match[7] : null;
}

async function main() {
    try {
        console.log('Connecting to DB...');
        await connectDB();

        const videoIds = VIDEO_URLS.map(url => {
            const id = extractVideoId(url);
            if (!id) console.warn(`Could not extract ID from URL: ${url}`);
            return id;
        }).filter((id): id is string => !!id);

        if (videoIds.length === 0) {
            console.log('No valid video IDs found.');
            return;
        }

        console.log('Starting pipeline for IDs:', videoIds);
        await processVideos(videoIds);

        console.log('Pipeline finished.');
    } catch (error) {
        console.error('Pipeline failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

main();
