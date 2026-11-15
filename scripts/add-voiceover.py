import asyncio
import edge_tts
import os
import subprocess
import path
import sys

# Tailored, friendly, natural script matching the exact visual cue points
script = [
    {
        "id": 0,
        "cue": "0:00 - Setup Screen opening",
        "target_start": 0.8,
        "text": "Welcome to ShipMate! Here we are on the setup screen, creating a sprint room for our hackathon team."
    },
    {
        "id": 1,
        "cue": "0:06 - Hackathon name and repo URL",
        "target_start": 7.5,
        "text": "We enter our hackathon name, connect our public GitHub repository, and configure the sprint timeline."
    },
    {
        "id": 2,
        "cue": "0:15 - Figma URL and teammates",
        "target_start": 15.0,
        "text": "Next, we link our Figma design and add our four teammates. Notice our designer is flagged, so UI work counts alongside code."
    },
    {
        "id": 3,
        "cue": "0:27 - One-time Lead Key modal",
        "target_start": 26.5,
        "text": "When we launch, ShipMate generates a one-time cryptographic Lead Key, ensuring privacy for the team lead."
    },
    {
        "id": 4,
        "cue": "0:36 - Dashboard enters & telemetry loads",
        "target_start": 36.5,
        "text": "Entering the dashboard, ShipMate tracks live activity from GitHub and Figma. We see active commits for the lead, while our teammate has zero."
    },
    {
        "id": 5,
        "cue": "0:46 - Private banner & WhatsApp ping",
        "target_start": 46.5,
        "text": "After six hours of silence, a private dead-man warning triggers. No public embarrassment! The lead can easily copy a friendly WhatsApp check-in ping."
    },
    {
        "id": 6,
        "cue": "0:58 - Triage modal opens",
        "target_start": 58.0,
        "text": "Now let's open the early triage advisor. Instead of waiting until the final hour, the lead can switch to a fallback API, cut scope, or snooze."
    },
    {
        "id": 7,
        "cue": "1:06 - Option A selected & note typed",
        "target_start": 68.5,
        "text": "We select Option A to switch to a fallback API, write our triage note, and persist the decision right to the database."
    },
    {
        "id": 8,
        "cue": "1:17 - Browser reload persistence",
        "target_start": 78.5,
        "text": "Watch what happens when we refresh the browser. The triage status persists seamlessly from Supabase."
    },
    {
        "id": 9,
        "cue": "1:27 - Manifest view loads",
        "target_start": 87.5,
        "text": "Next, let's head over to the Proof-of-Ship Manifest. This public page displays automated verification badges for every team member."
    },
    {
        "id": 10,
        "cue": "1:37 - Breakdown table & audit log",
        "target_start": 98.0,
        "text": "Designers get full credit for Figma specs, and all scope triage decisions are recorded in a clear audit trail."
    },
    {
        "id": 11,
        "cue": "1:47 - Copy submission markdown & outro",
        "target_start": 106.0,
        "text": "With one click, copy the judge-ready submission markdown for Devfolio or Devpost. That's ShipMate!"
    }
]

async def generate_speech(temp_dir):
    os.makedirs(temp_dir, exist_ok=True)
    voice = "en-US-JennyNeural"
    
    for item in script:
        i = item["id"]
        tts = edge_tts.Communicate(item["text"], voice, rate="+10%")
        out_file = os.path.join(temp_dir, f"seg_{i:02d}.mp3")
        await tts.save(out_file)
        item["file"] = out_file

def mux_voiceover(temp_dir, input_video, output_video):
    master_audio = os.path.join(temp_dir, "voiceover_master.mp3")
    
    cmd = ["ffmpeg", "-y"]
    for item in script:
        cmd.extend(["-i", item["file"]])

    filter_parts = []
    mix_inputs = []
    for i, item in enumerate(script):
        delay_ms = int(item["target_start"] * 1000)
        filter_parts.append(f"[{i}:a]adelay={delay_ms}|{delay_ms}[a{i}]")
        mix_inputs.append(f"[a{i}]")

    mix_str = "".join(mix_inputs) + f"amix=inputs={len(script)}:dropout_transition=0:normalize=0[aout]"
    filter_complex = ";".join(filter_parts) + ";" + mix_str

    cmd.extend([
        "-filter_complex", filter_complex,
        "-map", "[aout]",
        "-t", "113.6",
        "-c:a", "libmp3lame",
        "-b:a", "192k",
        master_audio
    ])

    subprocess.run(cmd, check=True)

    # Mux with video
    temp_output = os.path.join(temp_dir, "voiced.mp4")
    subprocess.run([
        "ffmpeg", "-y",
        "-i", input_video,
        "-i", master_audio,
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        temp_output
    ], check=True)

    os.replace(temp_output, output_video)
    print(f"Voiced video generated successfully: {output_video}")

if __name__ == "__main__":
    temp_dir = "/tmp/shipmate_voice"
    input_video = sys.argv[1] if len(sys.argv) > 1 else "shipmate_demo.mp4"
    output_video = sys.argv[2] if len(sys.argv) > 2 else input_video
    asyncio.run(generate_speech(temp_dir))
    mux_voiceover(temp_dir, input_video, output_video)
