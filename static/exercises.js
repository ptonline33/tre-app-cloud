// TRE exercise data with descriptions and SVG diagrams.
// Videos: mapped to publicly available guided/instructional videos.
// (Video IDs are Youtube watch IDs; each exercise links to a relevant guided segment.)

window.TRE_EXERCISES = [
  {
    id: "sway",
    number: 1,
    name: "Foot & Ankle Sway",
    type: "Standing",
    duration: "5\u20138 sways each way",
    purpose:
      "Gently wakes up the feet and ankles, bringing awareness into the lower body and preparing the legs for the exercises ahead.",
    steps: [
      "Take off shoes and socks; stand on a non-slip surface.",
      "Feet slightly wider than shoulder-width, toes pointing straight ahead.",
      "Sway your weight to one side so both feet roll the same way \u2014 outer edge of one foot, inner edge of the other.",
      "Hold a few seconds, then sway slowly across to the other side.",
      "Repeat slowly 5\u20138 times in each direction.",
      "Notice any tightness or restriction without trying to change it.",
      "Finish by shaking out your feet.",
    ],
    video: "https://www.youtube.com/watch?v=FeUioDuJjFI",
    videoTitle: "See this prep exercise in a full routine (Spira \u2014 TRE Full Body Practice)",
    svg: `
      <svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Foot and ankle sway">
        <rect width="220" height="220" rx="16" fill="#fdf4ea"/>
        <line x1="26" y1="190" x2="194" y2="190" stroke="#dcd3c6" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="90" cy="186" rx="16" ry="6" fill="#d59a6e"/>
        <ellipse cx="130" cy="186" rx="16" ry="6" fill="#d59a6e"/>
        <line x1="92" y1="184" x2="95" y2="132" stroke="#e9b68f" stroke-width="12" stroke-linecap="round"/>
        <line x1="128" y1="184" x2="125" y2="132" stroke="#e9b68f" stroke-width="12" stroke-linecap="round"/>
        <path d="M88 132 L132 132 L128 114 Q110 106 92 114 Z" fill="#5a87b0"/>
        <path d="M93 114 Q110 100 127 114 L125 82 Q110 74 95 82 Z" fill="#e9b68f"/>
        <line x1="97" y1="86" x2="72" y2="116" stroke="#e9b68f" stroke-width="10" stroke-linecap="round"/>
        <line x1="123" y1="86" x2="148" y2="114" stroke="#e9b68f" stroke-width="10" stroke-linecap="round"/>
        <circle cx="72" cy="120" r="6" fill="#d59a6e"/>
        <circle cx="148" cy="118" r="6" fill="#d59a6e"/>
        <circle cx="110" cy="58" r="20" fill="#e9b68f"/>
        <path d="M97 50 A20 20 0 0 1 123 50 L123 62 Q110 50 97 62 Z" fill="#5a4636"/>
        <circle cx="105" cy="60" r="2.2" fill="#4a3b2f"/>
        <circle cx="115" cy="60" r="2.2" fill="#4a3b2f"/>
        <path d="M55 150 q-6 -8 0 -16 q6 -8 0 -16" fill="none" stroke="#86a7c6" stroke-width="3" stroke-linecap="round"/>
        <path d="M165 150 q6 -8 0 -16 q-6 -8 0 -16" fill="none" stroke="#86a7c6" stroke-width="3" stroke-linecap="round"/>
      </svg>`,
  },
  {
    id: "heel",
    number: 2,
    name: "Single-Leg Heel Lifts",
    type: "Standing",
    duration: "5\u20138 lifts each leg",
    purpose:
      "Loads one calf at a time and begins building gentle fatigue in the legs \u2014 essential preparation for the tremor response.",
    steps: [
      "Place one foot in front of you and shift all your weight onto that front leg; the back leg rests for balance.",
      "On the front foot, rise up onto your toes, lifting the heel as high as possible.",
      "Lower the foot back to the floor.",
      "Repeat 5\u20138 times depending on leg strength.",
      "If painful or burning, stop.",
      "Return to standing and shake out the working leg.",
      "Repeat on the other side and shake it out too.",
    ],
    video: "https://www.youtube.com/watch?v=W1ODEOd2suU",
    videoTitle: "See this calf/leg prep exercise in a session (Dr. Berceli, guided)",
    svg: `
      <svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Single-leg heel lift">
        <rect width="220" height="220" rx="16" fill="#fdf4ea"/>
        <line x1="30" y1="188" x2="190" y2="188" stroke="#dcd3c6" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="118" cy="176" rx="12" ry="5" fill="#d59a6e"/>
        <line x1="120" y1="174" x2="122" y2="126" stroke="#e9b68f" stroke-width="12" stroke-linecap="round"/>
        <path d="M120 126 L122 110 Q120 102 118 110 Z" fill="#5a87b0"/>
        <ellipse cx="156" cy="132" rx="6" ry="9" fill="#d59a6e"/>
        <line x1="150" y1="176" x2="148" y2="124" stroke="#e9b68f" stroke-width="11" stroke-linecap="round"/>
        <path d="M139 124 L158 124 L157 108 Q148 102 140 108 Z" fill="#5a87b0"/>
        <path d="M114 112 Q128 98 144 112 L142 82 Q128 76 116 82 Z" fill="#e9b68f"/>
        <line x1="118" y1="80" x2="96" y2="104" stroke="#e9b68f" stroke-width="10" stroke-linecap="round"/>
        <line x1="140" y1="78" x2="158" y2="104" stroke="#e9b68f" stroke-width="10" stroke-linecap="round"/>
        <circle cx="94" cy="108" r="6" fill="#d59a6e"/>
        <circle cx="160" cy="108" r="6" fill="#d59a6e"/>
        <circle cx="130" cy="52" r="20" fill="#e9b68f"/>
        <path d="M117 44 A20 20 0 0 1 143 44 L143 56 Q130 44 117 56 Z" fill="#5a4636"/>
        <circle cx="125" cy="54" r="2.2" fill="#4a3b2f"/>
        <circle cx="135" cy="54" r="2.2" fill="#4a3b2f"/>
        <path d="M74 66 L84 60 M74 78 L84 72" stroke="#86a7c6" stroke-width="3.5" stroke-linecap="round"/>
        <text x="90" y="150" font-size="14" text-anchor="middle" fill="#86a7c6">\u2191 lift</text>
      </svg>`,
  },
  {
    id: "fwd",
    number: 3,
    name: "Forward Bend Leg Stretch",
    type: "Standing",
    duration: "5\u201310 repetitions",
    purpose:
      "Loads the hamstrings, calves, and lower back \u2014 regions that commonly hold chronic tension \u2014 deepening the preparatory fatigue.",
    steps: [
      "Bend slowly forward and place both hands on the ground close to your feet.",
      "Lower your buttocks slightly, as if sitting into a chair \u2014 this bends the knees.",
      "Don't let the knee travel forward beyond the length of the foot.",
      "Straighten the legs as far as you can without hurting or pulling the hamstrings.",
      "Repeat 5\u201310 times depending on strength and flexibility.",
      "If hard on the knees: from standing, simply bend one standing knee, then straighten, 5\u201310 times.",
      "If still too much, treat this one as optional and move on.",
    ],
    video: "https://www.youtube.com/watch?v=NKfFpMwMnyE",
    videoTitle: "See this standing bend in a guided practice (Dr. Berceli)",
    svg: `
      <svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Forward bend leg stretch">
        <rect width="220" height="220" rx="16" fill="#fdf4ea"/>
        <line x1="26" y1="188" x2="194" y2="188" stroke="#dcd3c6" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="108" cy="184" rx="15" ry="6" fill="#d59a6e"/>
        <ellipse cx="146" cy="184" rx="15" ry="6" fill="#d59a6e"/>
        <line x1="122" y1="182" x2="126" y2="132" stroke="#e9b68f" stroke-width="12" stroke-linecap="round"/>
        <line x1="143" y1="182" x2="138" y2="136" stroke="#e9b68f" stroke-width="12" stroke-linecap="round"/>
        <path d="M122 132 L138 136 L134 112 Q128 108 124 112 Z" fill="#5a87b0"/>
        <path d="M124 112 Q118 96 96 92 L118 84 Q132 96 134 112 Z" fill="#e9b68f"/>
        <circle cx="94" cy="82" r="19" fill="#e9b68f"/>
        <path d="M114 100 L84 152" stroke="#e9b68f" stroke-width="10" stroke-linecap="round"/>
        <circle cx="84" cy="156" r="6" fill="#d59a6e"/>
        <line x1="120" y1="104" x2="150" y2="150" stroke="#e9b68f" stroke-width="10" stroke-linecap="round"/>
        <circle cx="151" cy="154" r="6" fill="#d59a6e"/>
        <path d="M80 60 q-7 -9 0 -18 q7 -9 0 -18" fill="none" stroke="#86a7c6" stroke-width="3" stroke-linecap="round"/>
        <text x="118" y="168" font-size="13" text-anchor="middle" fill="#86a7c6">bend</text>
      </svg>`,
  },
  {
    id: "wide",
    number: 4,
    name: "Wide-Leg Forward Bend",
    type: "Standing",
    duration: "3 breaths per position",
    purpose:
      "Opens the inner thighs, groin, and hips \u2014 areas that store significant tension \u2014 and increases the load in the leg muscles.",
    steps: [
      "Stand with legs spread wide enough to feel a stretch through the inner thighs.",
      "Hang over forward \u2014 feel it in the inner thighs and backs of the legs.",
      "With hands in the middle between your feet, take 3 slow deep breaths.",
      "Walk your hands over toward one foot and hold for 3 slow deep breaths.",
      "Walk your hands across to the other foot and hold for 3 breaths.",
      "Walk back to the middle, then reach between your legs behind you and hold for 3 breaths.",
      "You may feel mild shaking in the legs \u2014 let it happen.",
      "To come out, place hands on your legs for support and slowly stand.",
    ],
    video: "https://www.youtube.com/watch?v=FeUioDuJjFI",
    videoTitle: "See this wide standing stretch in a full routine (Spira)",
    svg: `
      <svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Wide-leg forward bend">
        <rect width="220" height="220" rx="16" fill="#fdf4ea"/>
        <line x1="26" y1="186" x2="194" y2="186" stroke="#dcd3c6" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="62" cy="80" rx="6" ry="10" transform="rotate(-30 62 80)" fill="#d59a6e"/>
        <line x1="36" y1="102" x2="132" y2="110" stroke="#e9b68f" stroke-width="12" stroke-linecap="round"/>
        <ellipse cx="158" cy="80" rx="6" ry="10" transform="rotate(30 158 80)" fill="#d59a6e"/>
        <line x1="184" y1="102" x2="88" y2="112" stroke="#e9b68f" stroke-width="12" stroke-linecap="round"/>
        <path d="M102 108 L118 108 L116 84 Q110 80 104 84 Z" fill="#5a87b0"/>
        <circle cx="110" cy="66" r="20" fill="#e9b68f"/>
        <path d="M96 56 A22 22 0 0 1 124 56 L124 74 Q110 52 94 70 Z" fill="#5a4636"/>
        <line x1="96" y1="74" x2="64" y2="120" stroke="#e9b68f" stroke-width="10" stroke-linecap="round"/>
        <line x1="124" y1="72" x2="156" y2="118" stroke="#e9b68f" stroke-width="10" stroke-linecap="round"/>
        <circle cx="63" cy="124" r="6" fill="#d59a6e"/>
        <circle cx="157" cy="122" r="6" fill="#d59a6e"/>
        <text x="110" y="158" font-size="13" text-anchor="middle" fill="#86a7c6">wide</text>
        <path d="M52 40 q-6 -9 0 -18 q6 -9 0 -18" fill="none" stroke="#86a7c6" stroke-width="3" stroke-linecap="round"/>
        <path d="M168 40 q6 -9 0 -18 q-6 -9 0 -18" fill="none" stroke="#86a7c6" stroke-width="3" stroke-linecap="round"/>
      </svg>`,
  },
  {
    id: "front",
    number: 5,
    name: "Front Body Stretch",
    type: "Standing",
    duration: "3 breaths per position",
    purpose:
      "Opens the front of the body \u2014 chest, abdomen, hip flexors, and the psoas muscle, one of the primary muscles that contracts during a fear response.",
    steps: [
      "Keep your feet in the same wide position as the previous exercise.",
      "Place your hands on the lower back and buttocks to support the lower back.",
      "Push the pelvis gently forward so there is a gentle bow in the lower back \u2014 a stretch at the front of the thigh.",
      "Keeping the bow, twist gently from the hips to look behind you in one direction; take 3 deep breaths.",
      "Turn the other way, still bowed, and look behind you; take 3 deep breaths.",
      "Return to facing forward, still bowed, and take 3 more breaths.",
      "Release the bow and come back to normal standing.",
    ],
    video: "https://www.youtube.com/watch?v=SdQJg-HwsMQ",
    videoTitle: "See this front-of-body prep in a practice (Dr. Berceli)",
    svg: `
      <svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Front body stretch">
        <rect width="220" height="220" rx="16" fill="#fdf4ea"/>
        <line x1="26" y1="188" x2="194" y2="188" stroke="#dcd3c6" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="104" cy="184" rx="15" ry="6" fill="#d59a6e"/>
        <ellipse cx="146" cy="184" rx="15" ry="6" fill="#d59a6e"/>
        <line x1="110" y1="182" x2="118" y2="120" stroke="#e9b68f" stroke-width="12" stroke-linecap="round"/>
        <line x1="140" y1="182" x2="120" y2="122" stroke="#e9b68f" stroke-width="12" stroke-linecap="round"/>
        <path d="M116 120 L122 112 Q130 118 118 122 Z" fill="#5a87b0"/>
        <path d="M114 124 Q120 92 140 78 Q120 118 112 112 Z" fill="#e9b68f"/>
        <circle cx="142" cy="70" r="20" fill="#e9b68f"/>
        <path d="M128 62 A20 20 0 0 1 156 62 L156 74 Q142 60 128 74 Z" fill="#5a4636"/>
        <circle cx="138" cy="72" r="2.2" fill="#4a3b2f"/>
        <circle cx="150" cy="72" r="2.2" fill="#4a3b2f"/>
        <line x1="122" y1="98" x2="96" y2="124" stroke="#e9b68f" stroke-width="10" stroke-linecap="round"/>
        <circle cx="94" cy="128" r="6" fill="#d59a6e"/>
        <line x1="128" y1="100" x2="158" y2="80" stroke="#e9b68f" stroke-width="10" stroke-linecap="round"/>
        <circle cx="161" cy="78" r="6" fill="#d59a6e"/>
        <text x="120" y="165" font-size="13" text-anchor="middle" fill="#86a7c6">open chest</text>
        <path d="M60 150 q6 -8 0 -16 q-6 -8 0 -16" fill="none" stroke="#86a7c6" stroke-width="3" stroke-linecap="round"/>
      </svg>`,
  },
  {
    id: "wall",
    number: 6,
    name: "The Wall Sit",
    type: "Wall",
    duration: "3\u20135 minutes",
    purpose:
      "Puts sustained stress on the quadriceps \u2014 the big muscles at the front of the thigh \u2014 where the tremor often first appears on its own.",
    steps: [
      "Stand with your back against a wall and lower yourself as though sitting on an invisible chair \u2014 this loads the quadriceps.",
      "Stay there. After a few minutes you may feel tension, tightness, or tremoring.",
      "If it becomes slightly painful, move up the wall about two inches \u2014 the shaking may increase while the tension eases.",
      "If too stressful again, move up another two inches.",
      "Keep adjusting until you find where the legs tremor and nothing hurts.",
      "After 3\u20135 minutes, come off the wall and hang over forward, knees slightly bent, hands toward the ground if they reach.",
      "The shaking will likely increase here. Stay about one minute if you can.",
    ],
    video: "https://www.youtube.com/watch?v=QoB9wpuO688",
    videoTitle: "Follow a full guided session (Dr. Berceli)",
    svg: `
      <svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Wall sit">
        <rect width="220" height="220" rx="16" fill="#fdf4ea"/>
        <rect x="168" y="20" width="26" height="188" rx="4" fill="#d8d2c8"/>
        <rect x="172" y="20" width="4" height="188" fill="#c8c1b6"/>
        <line x1="136" y1="196" x2="150" y2="196" stroke="#c8c1b6" stroke-width="3"/>
        <line x1="136" y1="164" x2="150" y2="164" stroke="#c8c1b6" stroke-width="3"/>
        <path d="M176 82 L176 144 L132 144 Q134 96 176 82 Z" fill="#e9b68f"/>
        <line x1="176" y1="144" x2="176" y2="160" stroke="#5a87b0" stroke-width="12" stroke-linecap="round"/>
        <line x1="134" y1="146" x2="134" y2="196" stroke="#5a87b0" stroke-width="12" stroke-linecap="round"/>
        <ellipse cx="134" cy="196" rx="11" ry="5" fill="#d59a6e"/>
        <line x1="172" y1="160" x2="176" y2="188" stroke="#d59a6e" stroke-width="10" stroke-linecap="round"/>
        <circle cx="176" cy="188" r="6" fill="#d59a6e"/>
        <path d="M178 60 L188 40" stroke="#5a4636" stroke-width="10" stroke-linecap="round"/>
        <circle cx="176" cy="56" r="20" fill="#e9b68f"/>
        <path d="M164 48 A20 20 0 0 1 188 48 L188 60 Q176 46 164 60 Z" fill="#5a4636"/>
        <path d="M170 58 q2 -3 4 0 M178 58 q2 -3 4 0" fill="none" stroke="#4a3b2f" stroke-width="2" stroke-linecap="round"/>
        <path d="M160 60 A20 20 0 0 1 174 50" fill="none" stroke="#4a3b2f" stroke-width="2"/>
        <text x="120" y="120" font-size="13" text-anchor="middle" fill="#86a7c6">\u25b6 sit</text>
      </svg>`,
  },
  {
    id: "hips",
    number: 7,
    name: "Hips Up",
    type: "Floor / Mat",
    duration: "2\u20133 minutes",
    purpose:
      "The last of the seven \u2014 a short pelvic lift that loads the legs and pelvis one final time, then releases them. The tremoring often first arrives in this release.",
    steps: [
      "Lie down with the soles of your feet together and knees gently relaxed open, resting.",
      "Or, if your knees don't open comfortably, keep feet flat on the floor with knees pointing straight up.",
      "Lift your pelvis off the ground and hold for 30 seconds to one minute.",
      "Gently set your pelvis back down and let the knees rest for one minute.",
      "You may begin to feel tremoring or shaking in your legs. Nothing needs to be done about it.",
      "This is where the exercises end and the tremor begins.",
    ],
    video: "https://www.youtube.com/watch?v=NKfFpMwMnyE",
    videoTitle: "See the floor/lying positions (Dr. Berceli \u2014 lying down, sitting & standing)",
    svg: `
      <svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Hips up">
        <rect width="220" height="220" rx="16" fill="#fdf4ea"/>
        <line x1="20" y1="172" x2="200" y2="172" stroke="#dcd3c6" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="60" cy="166" rx="14" ry="6" fill="#d59a6e"/>
        <circle cx="60" cy="152" r="12" fill="#d59a6e"/>
        <line x1="64" y1="150" x2="62" y2="128" stroke="#e9b68f" stroke-width="12" stroke-linecap="round"/>
        <line x1="62" y1="126" x2="114" y2="112" stroke="#e9b68f" stroke-width="13" stroke-linecap="round"/>
        <path d="M114 110 L114 124 Q108 128 102 120 Z" fill="#5a87b0"/>
        <path d="M112 112 L110 166" stroke="#e9b68f" stroke-width="13" stroke-linecap="round"/>
        <line x1="110" y1="166" x2="180" y2="166" stroke="#e9b68f" stroke-width="12" stroke-linecap="round"/>
        <ellipse cx="186" cy="164" rx="13" ry="5" fill="#d59a6e"/>
        <line x1="112" y1="120" x2="130" y2="78" stroke="#e9b68f" stroke-width="11" stroke-linecap="round"/>
        <circle cx="132" cy="74" r="10" fill="#d59a6e"/>
        <circle cx="150" cy="62" r="19" fill="#e9b68f"/>
        <path d="M136 54 A19 19 0 0 1 164 54 L164 66 Q150 52 136 66 Z" fill="#5a4636"/>
        <path d="M130 150 q6 -8 0 -16 q-6 -8 0 -16" fill="none" stroke="#86a7c6" stroke-width="3" stroke-linecap="round"/>
        <text x="120" y="52" font-size="13" text-anchor="middle" fill="#86a7c6">lift \u2191</text>
      </svg>`,
  },
  {
    id: "tremor",
    number: 8,
    name: "Starting the Tremor",
    type: "Floor / Mat",
    duration: "15 minutes max",
    purpose:
      "The final step \u2014 the part the seven exercises were preparing for. Small two-inch adjustments allow the body's natural tremor response to arise and discharge tension.",
    steps: [
      "Stay where Exercise 7 left you.",
      "If your knees are open, close them about two inches. If straight up, open them about two inches. Stay 2 minutes \u2014 the tremoring may get stronger.",
      "If pleasant and comfortable, let it continue. If unpleasant, slide legs down flat, sit up, and integrate.",
      "Close the knees another two inches and allow the tremoring into the legs.",
      "Close them two inches again and let the shaking continue as long as feels right.",
      "For the last part, turn the bottoms of your feet flat and keep knees slightly apart \u2014 allow shaking to move up into the pelvis and lower back.",
      "To end, slide your feet down to lie flat, or roll onto your side and curl up to rest.",
      "Give yourself 5\u201310 minutes of quiet rest afterward. Drink water.",
    ],
    note: "Keep shaking to a maximum of 15 minutes, 2\u20133 times a week when starting out.",
    video: "https://www.youtube.com/watch?v=QoB9wpuO688",
    videoTitle: "Follow the full guided release \u2014 press play and tremor (Dr. Berceli)",
    svg: `
      <svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Starting the tremor">
        <rect width="220" height="220" rx="16" fill="#fdf4ea"/>
        <line x1="20" y1="176" x2="200" y2="176" stroke="#dcd3c6" stroke-width="4" stroke-linecap="round"/>
        <line x1="52" y1="168" x2="110" y2="168" stroke="#e9b68f" stroke-width="12" stroke-linecap="round"/>
        <ellipse cx="46" cy="166" rx="14" ry="6" fill="#d59a6e"/>
        <line x1="74" y1="168" x2="78" y2="120" stroke="#e9b68f" stroke-width="12" stroke-linecap="round"/>
        <line x1="80" y1="118" x2="120" y2="96" stroke="#e9b68f" stroke-width="13" stroke-linecap="round"/>
        <path d="M112 116 L130 96 L136 108 Q128 116 116 120 Z" fill="#5a87b0"/>
        <line x1="112" y1="96" x2="150" y2="66" stroke="#e9b68f" stroke-width="12" stroke-linecap="round"/>
        <circle cx="152" cy="62" r="19" fill="#e9b68f"/>
        <path d="M138 54 A19 19 0 0 1 166 54 L166 66 Q152 52 138 66 Z" fill="#5a4636"/>
        <path d="M122 112 L136 96" stroke="#e9b68f" stroke-width="9" stroke-linecap="round"/>
        <path d="M146 108 L160 92" stroke="#e9b68f" stroke-width="9" stroke-linecap="round"/>
        <line x1="118" y1="124" x2="176" y2="124" stroke="#e9b68f" stroke-width="11" stroke-linecap="round"/>
        <ellipse cx="182" cy="122" rx="12" ry="5" fill="#d59a6e"/>
        <path d="M150 76 q5 -7 10 0 q5 7 10 0 q5 -7 10 0 q5 7 10 0" fill="none" stroke="#86a7c6" stroke-width="3.5" stroke-linecap="round"/>
        <text x="150" y="150" font-size="13" text-anchor="middle" fill="#86a7c6">\u223c shake \u223c</text>
      </svg>`,
  },
];

window.TRE_GUIDED_VIDEO = "https://www.youtube.com/watch?v=QoB9wpuO688";

// Quick Essentials - the 2 most time-efficient exercises when low on time.
// Wall Sit quickly fatigues the quadriceps (where tremors first appear);
// the Tremor Release lets the body shake out the tension.
window.TRE_QUICK = {
  name: "Quick Essentials (2 exercises)",
  blurb:
    "Short on time? These are the two most impactful exercises. The Wall Sit quickly tires the thighs so the tremor reflex can switch on, and the Tremor (not) Release lets you discharge the tension on the floor. About 5\u20138 minutes total when done directly into the shake.",
  video: "https://www.youtube.com/watch?v=Hn167HCE6nk",
  videoTitle: "Quick Essentials routine video (2 exercises, short session)",
  steps: [
    "**Wall Sit (2\u20133 min):** Stand with your back against a wall and slide down as if sitting on an invisible chair. Keep sliding up/down to where the legs tremor without pain. Stay as long as is comfortable.",
    "**Come off the wall & bend forward:** Hang over with knees slightly bent, letting the shaking increase for a minute.",
    "**Lie down & release (3\u20135 min):** Lie down, soles of the feet together, knees relaxed open (or feet flat, knees up). Close the knees a couple of inches and simply allow the tremors. Slide legs down flat, sit up and rest when you finish.",
    "**After: drink water** and rest a few minutes before rising.",
  ],
  exercises: ["wall", "tremor"],
};
