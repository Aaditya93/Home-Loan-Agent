import sys
import json
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound

def get_transcript(video_id):
    try:
        api = YouTubeTranscriptApi()
        
        # Try to list transcripts and find English or auto-generated English
        transcript_list = api.list(video_id)
        
        transcript = None
        try:
            transcript = transcript_list.find_transcript(['en'])
        except:
            try:
                transcript = transcript_list.find_generated_transcript(['en'])
            except:
                # If no english, just take the first one
                for t in transcript_list:
                    transcript = t
                    break
        
        if transcript:
            data = transcript.fetch()
            # Check if data elements are dicts or objects
            if data and not isinstance(data[0], dict):
                 formatted = [{"text": i.text, "duration": i.duration, "offset": i.start} for i in data]
            else:
                 formatted = [{"text": i["text"], "duration": i["duration"], "offset": i["start"]} for i in data]
            
            print(json.dumps(formatted))
        else:
             print(json.dumps({"error": "No transcript found"}))
             sys.exit(1)

    except (TranscriptsDisabled, NoTranscriptFound) as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No video ID provided"}))
        sys.exit(1)
    
    video_id = sys.argv[1]
    get_transcript(video_id)
