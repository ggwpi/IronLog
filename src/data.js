(function(){
  const q = (term) => `https://www.youtube.com/results?search_query=${encodeURIComponent(term + ' proper form')}`;
  const ex = (id,name,sets,reps,rest,muscle,compound=true,videoQuery=name) => ({id,name,sets,reps,rest,muscle,compound,video:q(videoQuery)});
  window.IRONLOG_PROGRAM = [
    {id:'chest-biceps-a', short:'PUSH A', day:'שני', title:'Chest + Biceps', subtitle:'חזה + יד קדמית', exercises:[
      ex('incline-smith','Incline Smith Press',4,'8–10',150,'חזה עליון',true),
      ex('chest-press-machine','Chest Press Machine',4,'8–12',135,'חזה',true),
      ex('pec-deck','Pec Deck',3,'12–15',90,'חזה',false),
      ex('cable-fly','Cable Fly',3,'15–20',75,'חזה',false),
      ex('ez-curl','EZ Bar Curl',4,'8–10',120,'יד קדמית',true),
      ex('incline-db-curl','Incline DB Curl',3,'10–12',90,'יד קדמית',false),
      ex('hammer-curl','Hammer Curl',3,'12',90,'יד קדמית / אמה',false)
    ]},
    {id:'legs-heavy', short:'LEGS A', day:'שלישי', title:'Legs Heavy + Abs', subtitle:'רגליים כבד + בטן', exercises:[
      ex('hack-squat-heavy','Hack Squat',4,'6–8',180,'ארבע ראשי / ישבן',true),
      ex('romanian-deadlift','Romanian Deadlift',4,'8',180,'המסטרינג / ישבן',true),
      ex('leg-press-heavy','Leg Press',4,'10',165,'ארבע ראשי / ישבן',true),
      ex('bulgarian-split','Bulgarian Split Squat',3,'10 / רגל',150,'ארבע ראשי / ישבן',true),
      ex('leg-curl','Leg Curl',3,'12',90,'המסטרינג',false),
      ex('standing-calf','Standing Calf Raise',5,'12',75,'תאומים',false),
      ex('hanging-leg-raise','Hanging Leg Raise',3,'15',60,'בטן',false),
      ex('cable-crunch','Cable Crunch',3,'15',60,'בטן',false)
    ]},
    {id:'back-triceps', short:'PULL A', day:'רביעי', title:'Back + Triceps', subtitle:'גב + יד אחורית', exercises:[
      ex('pullups','Pull-ups',4,'AMRAP',150,'גב / רחב גבי',true),
      ex('chest-supported-row','Chest Supported Row',4,'8–10',150,'גב אמצעי',true),
      ex('lat-pulldown','Lat Pulldown',3,'10–12',120,'רחב גבי',true),
      ex('seated-cable-row','Seated Cable Row',3,'12',120,'גב אמצעי',true),
      ex('face-pull','Face Pull',3,'15',75,'כתף אחורית / גב עליון',false),
      ex('rope-pushdown','Rope Pushdown',4,'10–12',90,'יד אחורית',false),
      ex('overhead-cable-ext','Overhead Cable Extension',3,'12',90,'יד אחורית',false),
      ex('machine-dips','Machine Dips',3,'10–12',120,'יד אחורית / חזה',true)
    ]},
    {id:'shoulders-chest', short:'PUSH B', day:'חמישי', title:'Shoulders + Chest', subtitle:'כתפיים + חזה', exercises:[
      ex('shoulder-press-machine','Shoulder Press Machine',4,'8–10',150,'כתף קדמית / אמצעית',true),
      ex('cable-lateral-raise','Cable Lateral Raise',5,'15',60,'כתף אמצעית',false),
      ex('rear-delt-fly','Rear Delt Fly Machine',4,'15',75,'כתף אחורית',false),
      ex('incline-chest-machine','Incline Chest Press Machine',4,'10',135,'חזה עליון',true),
      ex('cable-fly-b','Cable Fly',3,'15',75,'חזה',false)
    ]},
    {id:'legs-hypertrophy', short:'LEGS B', day:'שישי', title:'Legs Hypertrophy + Abs', subtitle:'רגליים נפח + בטן', exercises:[
      ex('hack-squat-volume','Hack Squat',4,'10',150,'ארבע ראשי / ישבן',true),
      ex('leg-press-volume','Leg Press',4,'15',135,'ארבע ראשי / ישבן',true),
      ex('leg-extension','Leg Extension',4,'15',75,'ארבע ראשי',false),
      ex('seated-leg-curl','Seated Leg Curl',4,'15',75,'המסטרינג',false),
      ex('walking-lunges','Walking Lunges',3,'20 צעדים',120,'רגליים / ישבן',true),
      ex('seated-calf','Seated Calf Raise',5,'20',60,'תאומים',false),
      ex('ab-wheel','Ab Wheel',3,'12',60,'בטן',false),
      ex('plank','Plank',3,'זמן',60,'ליבה',false)
    ]},
    {id:'arms-shoulders', short:'ARMS', day:'שבת', title:'Arms + Shoulders', subtitle:'ידיים + כתפיים', exercises:[
      ex('barbell-curl','Barbell Curl',4,'8',120,'יד קדמית',true),
      ex('preacher-curl','Preacher Curl',3,'12',90,'יד קדמית',false),
      ex('cable-curl','Cable Curl',3,'15',75,'יד קדמית',false),
      ex('skull-crushers','Skull Crushers EZ',4,'8',120,'יד אחורית',true),
      ex('rope-pushdown-b','Rope Pushdown',3,'15',75,'יד אחורית',false),
      ex('overhead-cable-ext-b','Overhead Cable Extension',3,'12',90,'יד אחורית',false),
      ex('lateral-raise','Lateral Raise',4,'15',60,'כתף אמצעית',false),
      ex('rear-delt-machine','Rear Delt Machine',3,'15',75,'כתף אחורית',false)
    ]}
  ];
})();
