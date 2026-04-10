// Marathon Plan: 52 weeks, start on any Monday
// Running: Tuesday, Thursday, Saturday
// Strength: Monday, Wednesday, Friday
// Rest: Sunday

const STRENGTH = {
  push: {
    p1: {
      title: 'Fuerza Superior — Empuje',
      focus: 'Pecho, Hombros, Tríceps',
      exercises: [
        { name: 'Flexiones', sets: 3, reps: '8-10', rest: '60s', tip: 'Cuerpo en línea recta, codos a 45°' },
        { name: 'Press de hombros con mancuernas', sets: 3, reps: '10', rest: '60s', tip: 'Sentado o de pie, controla la bajada' },
        { name: 'Aperturas con mancuernas', sets: 3, reps: '12', rest: '60s', tip: 'Tumbado, ligera flexión de codo' },
        { name: 'Extensiones de tríceps', sets: 3, reps: '12', rest: '60s', tip: 'Con mancuerna o banda elástica' },
        { name: 'Elevaciones laterales', sets: 3, reps: '12', rest: '60s', tip: 'Control total, no balancees' },
      ]
    },
    p2: {
      title: 'Fuerza Superior — Empuje',
      focus: 'Pecho, Hombros, Tríceps (Intermedio)',
      exercises: [
        { name: 'Flexiones explosivas', sets: 3, reps: '8', rest: '90s', tip: 'Empuja fuerte, aterriza suave' },
        { name: 'Press militar con mancuernas', sets: 4, reps: '10', rest: '90s', tip: 'Peso progresivo semana a semana' },
        { name: 'Press inclinado con mancuernas', sets: 3, reps: '10', rest: '90s', tip: 'Banco a 30-45 grados' },
        { name: 'Dips en silla', sets: 3, reps: '10', rest: '90s', tip: 'Pies elevados para más dificultad' },
        { name: 'Elevaciones frontales alternas', sets: 3, reps: '12', rest: '60s', tip: 'Codos ligeramente flexionados' },
      ]
    },
    p3: {
      title: 'Fuerza Superior — Empuje (Alta Intensidad)',
      focus: 'Pecho, Hombros, Tríceps (Avanzado)',
      exercises: [
        { name: 'Press de banca', sets: 4, reps: '6-8', rest: '2 min', tip: 'Peso desafiante, pareja de seguridad' },
        { name: 'Press militar con barra', sets: 4, reps: '6-8', rest: '2 min', tip: 'De pie, activa el core' },
        { name: 'Fondos / Dips', sets: 3, reps: '8-10', rest: '90s', tip: 'Añade lastre si puedes' },
        { name: 'Aperturas con mancuernas', sets: 3, reps: '12', rest: '60s', tip: 'Rango de movimiento completo' },
        { name: 'Elevaciones laterales pesadas', sets: 4, reps: '10', rest: '60s', tip: 'Pausa de 1 segundo arriba' },
      ]
    },
    p4: {
      title: 'Mantenimiento — Empuje',
      focus: 'Ligero, conservar fuerza pre-carrera',
      exercises: [
        { name: 'Flexiones', sets: 3, reps: '12', rest: '60s', tip: 'Técnica perfecta, sin fatiga' },
        { name: 'Press de hombros', sets: 3, reps: '10', rest: '60s', tip: 'Peso moderado, nada pesado' },
        { name: 'Extensiones de tríceps', sets: 3, reps: '12', rest: '60s', tip: 'Ligero, mantener activación' },
      ]
    }
  },
  legs: {
    p1: {
      title: 'Fuerza Inferior — Piernas',
      focus: 'Cuádriceps, Glúteos, Isquios, Gemelos',
      exercises: [
        { name: 'Sentadillas con peso corporal', sets: 3, reps: '12-15', rest: '60s', tip: 'Rodillas sobre pies, espalda recta' },
        { name: 'Zancadas', sets: 3, reps: '10 c/pierna', rest: '60s', tip: 'Torso erguido, rodilla no supera el pie' },
        { name: 'Puente de glúteo', sets: 3, reps: '15', rest: '60s', tip: 'Aprieta glúteos 1 segundo arriba' },
        { name: 'Peso muerto rumano', sets: 3, reps: '12', rest: '60s', tip: 'Caderas atrás, espalda neutra' },
        { name: 'Elevaciones de talones', sets: 3, reps: '20', rest: '45s', tip: 'Rango completo, sin rebote' },
      ]
    },
    p2: {
      title: 'Fuerza Inferior — Piernas (Intermedio)',
      focus: 'Cuádriceps, Glúteos, Isquios, Estabilidad',
      exercises: [
        { name: 'Sentadillas búlgaras', sets: 3, reps: '10 c/pierna', rest: '90s', tip: 'Pie trasero en banco, core activo' },
        { name: 'Goblet squat con mancuerna', sets: 3, reps: '12', rest: '90s', tip: 'Mancuerna al pecho, profundidad total' },
        { name: 'Hip thrust', sets: 3, reps: '12', rest: '90s', tip: 'Hombros en banco, barra en caderas' },
        { name: 'Step-ups', sets: 3, reps: '10 c/pierna', rest: '60s', tip: 'Caja firme, empuja con el talón' },
        { name: 'Elevaciones de talones lastradas', sets: 4, reps: '15', rest: '45s', tip: 'Mancuerna en mano, rango completo' },
      ]
    },
    p3: {
      title: 'Fuerza Inferior — Alta Intensidad',
      focus: 'Fuerza máxima de piernas',
      exercises: [
        { name: 'Sentadillas con barra', sets: 4, reps: '6-8', rest: '2 min', tip: 'Profundidad completa, core muy activo' },
        { name: 'Peso muerto', sets: 4, reps: '5-6', rest: '2 min', tip: 'Espalda neutral, empuja el suelo' },
        { name: 'Hip thrust pesado', sets: 4, reps: '10', rest: '90s', tip: 'Con barra, activa glúteos al máximo' },
        { name: 'Zancadas con mancuernas caminando', sets: 3, reps: '12 c/pierna', rest: '60s', tip: 'Paso largo, equilibrio' },
        { name: 'Nordic curl', sets: 3, reps: '5-6', rest: '90s', tip: 'Asistido si lo necesitas, previene lesiones' },
      ]
    },
    p4: {
      title: 'Mantenimiento — Piernas',
      focus: 'Activación, nada pesado',
      exercises: [
        { name: 'Sentadillas ligeras', sets: 3, reps: '15', rest: '60s', tip: 'Movilidad, no carga' },
        { name: 'Zancadas', sets: 3, reps: '10 c/pierna', rest: '60s', tip: 'Ligeras, solo activar' },
        { name: 'Puente de glúteo', sets: 3, reps: '20', rest: '45s', tip: 'Activar glúteos, no fatigar' },
      ]
    }
  },
  pull: {
    p1: {
      title: 'Fuerza Superior — Jalón + Core',
      focus: 'Espalda, Bíceps, Core',
      exercises: [
        { name: 'Remo con mancuerna', sets: 3, reps: '10 c/brazo', rest: '60s', tip: 'Codo pegado al cuerpo, retrae escápula' },
        { name: 'Jalones en polea / banda', sets: 3, reps: '12', rest: '60s', tip: 'O pull-ups asistidos si tienes barra' },
        { name: 'Curl de bíceps con mancuernas', sets: 3, reps: '12', rest: '60s', tip: 'Codos fijos, no balancees el torso' },
        { name: 'Plancha', sets: 3, reps: '30 seg', rest: '45s', tip: 'Cuerpo recto, respira con normalidad' },
        { name: 'Abdominales', sets: 3, reps: '15', rest: '45s', tip: 'Controlado, sin tirar del cuello' },
        { name: 'Superman', sets: 3, reps: '12', rest: '45s', tip: 'Pausa 1-2 segundos arriba' },
      ]
    },
    p2: {
      title: 'Fuerza Superior — Jalón + Core (Intermedio)',
      focus: 'Espalda, Bíceps, Core',
      exercises: [
        { name: 'Dominadas asistidas / Pull-ups', sets: 3, reps: '6-8', rest: '90s', tip: 'Rango completo, no uses el impulso' },
        { name: 'Remo con barra', sets: 3, reps: '10', rest: '90s', tip: 'Espalda plana, tira hacia el abdomen' },
        { name: 'Face pull con banda', sets: 3, reps: '15', rest: '60s', tip: 'Codos a la altura de los hombros' },
        { name: 'Curl martillo', sets: 3, reps: '12', rest: '60s', tip: 'Agarre neutro, contracción completa' },
        { name: 'Plancha lateral', sets: 3, reps: '30 seg c/lado', rest: '45s', tip: 'Caderas alineadas, no dejes caer' },
        { name: 'Rueda abdominal', sets: 3, reps: '8', rest: '60s', tip: 'De rodillas, espalda neutra todo el tiempo' },
      ]
    },
    p3: {
      title: 'Fuerza Superior — Jalón + Core (Avanzado)',
      focus: 'Espalda pesada, Core estabilizador',
      exercises: [
        { name: 'Dominadas / Pull-ups', sets: 4, reps: '5-8', rest: '2 min', tip: 'Añade lastre si haces más de 10' },
        { name: 'Remo con barra pesado', sets: 4, reps: '8', rest: '2 min', tip: 'Peso desafiante, retracción escapular' },
        { name: 'Remo en polea baja', sets: 3, reps: '12', rest: '90s', tip: 'Espalda recta, aprieta al final' },
        { name: 'Curl de bíceps concentrado', sets: 3, reps: '10 c/brazo', rest: '60s', tip: 'Máxima contracción arriba' },
        { name: 'Rueda abdominal de pie', sets: 3, reps: '6-8', rest: '90s', tip: 'Avanzado, espalda neutra' },
        { name: 'Plancha con toque de hombros', sets: 3, reps: '40 seg', rest: '60s', tip: 'Estabiliza las caderas' },
      ]
    },
    p4: {
      title: 'Mantenimiento — Jalón + Core',
      focus: 'Ligero, solo mantener',
      exercises: [
        { name: 'Remo con mancuerna', sets: 3, reps: '12', rest: '60s', tip: 'Peso ligero, técnica perfecta' },
        { name: 'Curl de bíceps', sets: 3, reps: '12', rest: '60s', tip: 'Moderado' },
        { name: 'Plancha', sets: 3, reps: '45 seg', rest: '45s', tip: 'Mantén la forma' },
        { name: 'Abdominales suaves', sets: 3, reps: '15', rest: '45s', tip: 'Sin fatiga abdominal' },
      ]
    }
  }
}

const LONG_RUN = {
  1:5, 2:10, 3:10, 4:10, 5:12, 6:10, 7:12, 8:14,
  9:14, 10:12, 11:15, 12:16, 13:18, 14:16, 15:18, 16:20,
  17:21, 18:18, 19:21, 20:23, 21:24, 22:21, 23:24, 24:26,
  25:27, 26:24, 27:27, 28:29, 29:30, 30:27, 31:30, 32:32,
  33:32, 34:29, 35:32, 36:34, 37:35, 38:32, 39:34, 40:35,
  41:35, 42:32, 43:32, 44:30, 45:29, 46:27, 47:24, 48:21,
  49:18, 50:16, 51:14, 52:10
}

const TUE_KM = {
  1:5,2:5,3:5,4:5,5:6,6:6,7:6,8:6,
  9:7,10:7,11:8,12:8,13:8,14:8,15:9,16:9,
  17:9,18:9,19:9,20:8,21:10,22:10,23:10,24:10,
  25:12,26:12,27:12,28:10,29:12,30:12,31:12,32:10,
  33:14,34:14,35:14,36:12,37:14,38:14,39:14,40:12,
  41:12,42:12,43:10,44:10,45:10,46:8,47:8,48:6,
  49:6,50:6,51:5,52:6
}

const THU_KM = {
  1:5,2:5,3:5,4:5,5:6,6:6,7:6,8:6,
  9:7,10:7,11:8,12:8,13:8,14:8,15:9,16:9,
  17:9,18:10,19:10,20:8,21:10,22:10,23:12,24:10,
  25:12,26:12,27:12,28:10,29:14,30:14,31:14,32:10,
  33:14,34:14,35:14,36:12,37:16,38:16,39:16,40:12,
  41:14,42:14,43:12,44:10,45:10,46:8,47:8,48:6,
  49:6,50:6,51:5,52:4
}

function getStrengthPhase(week) {
  if (week <= 12) return 'p1'
  if (week <= 28) return 'p2'
  if (week <= 48) return 'p3'
  return 'p4'
}

function getRunningPhase(week) {
  if (week <= 8) return 1
  if (week <= 16) return 2
  if (week <= 24) return 3
  if (week <= 36) return 4
  if (week <= 44) return 5
  if (week <= 51) return 6
  return 7
}

export function getPhaseName(week) {
  if (week === 52) return { name: '¡SEMANA DE CARRERA!', color: '#eab308' }
  if (week <= 4) return { name: 'Base — Fundamentos', color: '#22c55e' }
  if (week <= 8) return { name: 'Base — Desarrollo', color: '#22c55e' }
  if (week <= 12) return { name: 'Construcción Aeróbica I', color: '#3b82f6' }
  if (week <= 16) return { name: 'Construcción Aeróbica II', color: '#3b82f6' }
  if (week <= 20) return { name: 'Introducción a Calidad', color: '#f59e0b' }
  if (week <= 24) return { name: 'Desarrollo de Calidad', color: '#f59e0b' }
  if (week <= 28) return { name: 'Pico I', color: '#f97316' }
  if (week <= 32) return { name: 'Pico II', color: '#f97316' }
  if (week <= 36) return { name: 'Específico Maratón I', color: '#ef4444' }
  if (week <= 40) return { name: 'Específico Maratón II', color: '#ef4444' }
  if (week <= 44) return { name: 'Específico Maratón III', color: '#ef4444' }
  if (week <= 48) return { name: 'Tapering Temprano', color: '#a855f7' }
  return { name: 'Tapering Final', color: '#a855f7' }
}

function getTuesdayWorkout(week) {
  const km = TUE_KM[week] || 5
  const phase = getRunningPhase(week)
  if (week === 52) {
    return {
      type: 'run', title: 'Rodaje de activación',
      distance: 6, intensity: 'easy',
      description: 'Trote muy suave 6 km. El objetivo es mantener las piernas activas y la mente tranquila. No te apresures, disfruta del movimiento.',
      warmup: '5 min caminata', cooldown: '5 min caminata + estiramientos suaves'
    }
  }
  if (phase <= 2) {
    return {
      type: 'run', title: 'Rodaje Suave',
      distance: km, intensity: 'easy',
      description: `${km} km a ritmo cómodo (Zona 2). Debes poder mantener una conversación fluida. Si sientes que te falta el aire, reduce el ritmo.`,
      warmup: '5 min caminata', cooldown: '5 min caminata + 10 min estiramientos'
    }
  }
  if (phase === 3) {
    return {
      type: 'run', title: 'Rodaje + Acelerones',
      distance: km, intensity: 'easy',
      description: `${km} km suave. En los últimos 2 km añade 4-5 acelerones de 20 segundos (casi a máxima velocidad) con 60 seg de recuperación entre ellos.`,
      warmup: '5 min caminata', cooldown: '10 min estiramientos'
    }
  }
  if (phase === 4) {
    return {
      type: 'run', title: 'Rodaje Tempo',
      distance: km, intensity: 'tempo',
      description: `${km} km total. Estructura: 2 km calentamiento suave → ${km - 4} km a ritmo umbral (puedes hablar pero con dificultad, ≈75-80% FCmáx) → 2 km enfriamiento. Esfuerzo controlado y constante.`,
      warmup: '2 km muy suave', cooldown: '2 km suave + estiramientos'
    }
  }
  if (phase === 5) {
    return {
      type: 'run', title: 'Rodaje a Ritmo de Maratón',
      distance: km, intensity: 'tempo',
      description: `${km} km. Estructura: 2 km calentamiento → ${km - 4} km a ritmo objetivo de maratón (constante, controlado, el ritmo que quieres mantener 42 km) → 2 km enfriamiento.`,
      warmup: '2 km suave', cooldown: '2 km suave + estiramientos'
    }
  }
  return {
    type: 'run', title: 'Rodaje Suave (Tapering)',
    distance: km, intensity: 'easy',
    description: `${km} km suave. Piernas ligeras, no te fuerces. El tapering es tu aliado. Mantén la cadencia, rodaje de calidad a intensidad baja.`,
    warmup: '5 min caminata', cooldown: '10 min estiramientos'
  }
}

function getThursdayWorkout(week) {
  const km = THU_KM[week] || 5
  const phase = getRunningPhase(week)
  if (week === 52) {
    return {
      type: 'run', title: 'Activación pre-maratón',
      distance: 4, intensity: 'easy',
      description: '4 km muy suave, solo para mover las piernas. Descansa mañana. Prepara la ropa, zapatillas y la nutrición para el día de la carrera.',
      warmup: '5 min caminata', cooldown: '5 min caminata + estiramientos suaves'
    }
  }
  if (phase <= 2) {
    return {
      type: 'run', title: 'Rodaje Suave',
      distance: km, intensity: 'easy',
      description: `${km} km a ritmo fácil, Zona 2. Escucha a tu cuerpo, si tienes fatiga de martes reduce el ritmo. El objetivo es recuperar y seguir acumulando volumen.`,
      warmup: '5 min caminata', cooldown: '5 min caminata + estiramientos'
    }
  }
  if (phase === 3) {
    return {
      type: 'run', title: 'Fartlek',
      distance: km, intensity: 'moderate',
      description: `${km} km con Fartlek libre. Tras 1-2 km de calentamiento, intercala cambios de ritmo de 1-2 min más rápido con 2-3 min suave, según te vayas sintiendo. Termina con 1 km suave.`,
      warmup: '1-2 km suave', cooldown: '1 km suave + estiramientos'
    }
  }
  if (phase === 4) {
    const reps = km <= 10 ? '6×800m' : '5×1000m'
    return {
      type: 'run', title: `Intervalos — ${reps}`,
      distance: km, intensity: 'intervals',
      description: `${km} km total. 2 km calentamiento → ${reps} a ritmo fuerte (5-10k pace, Zona 5, no puedes hablar) con recuperación de 90 seg trotando entre series → 2 km enfriamiento.`,
      warmup: '2 km suave', cooldown: '2 km suave + estiramientos'
    }
  }
  if (phase === 5) {
    const reps = km <= 14 ? '5×1000m' : '4×1200m'
    return {
      type: 'run', title: `Intervalos — ${reps}`,
      distance: km, intensity: 'intervals',
      description: `${km} km total. 2 km calentamiento → ${reps} a ritmo 10k-15k (Zona 4-5, muy incómodo) con 2 min de recuperación trotando → 2 km enfriamiento. Enfócate en la cadencia.`,
      warmup: '2 km suave', cooldown: '2 km suave + estiramientos'
    }
  }
  return {
    type: 'run', title: 'Rodaje Suave (Tapering)',
    distance: km, intensity: 'easy',
    description: `${km} km suave. Solo mantenimiento. Cuerpo fresco para la carrera. Disfruta del movimiento sin presión de ritmo.`,
    warmup: '5 min caminata', cooldown: '10 min estiramientos'
  }
}

function getSaturdayWorkout(week) {
  const km = LONG_RUN[week] || 10
  const phase = getRunningPhase(week)
  if (week === 52) {
    return {
      type: 'race', title: '¡MARATÓN! 42.195 km',
      distance: 42.195, intensity: 'race',
      description: '¡Es el gran día! 52 semanas de trabajo convergen aquí. Arranca más despacio de lo que crees que debes. Mantén el plan de nutrición. Divide la carrera en tercios: conservar, mantener, dar todo. ¡Disfruta cada kilómetro, te lo has ganado!',
      warmup: '10-15 min caminata suave antes de la salida', cooldown: 'Recuperación activa, hidratación y celebración'
    }
  }
  if (phase <= 2) {
    return {
      type: 'run', title: 'Tirada Larga',
      distance: km, intensity: 'easy',
      description: `${km} km a ritmo muy suave (Zona 1-2). El ritmo de fondo largo debe ser 60-90 seg por km más lento que tu ritmo de competición. La distancia es lo que importa, no la velocidad.`,
      warmup: '5 min caminata', cooldown: '5 min caminata + 15 min estiramientos completos'
    }
  }
  if (phase === 3) {
    return {
      type: 'run', title: 'Tirada Larga',
      distance: km, intensity: 'easy',
      description: `${km} km. Los primeros 2/3 muy suave (Zona 2). En el último tercio puedes subir ligeramente a Zona 3 si te encuentras bien. Hidratación cada 20-25 min y gel/avituallamiento si supera 90 min.`,
      warmup: '5 min caminata', cooldown: '5 min caminata + 15 min estiramientos'
    }
  }
  if (phase >= 4 && phase <= 5) {
    const mpKm = Math.round(km * 0.3)
    return {
      type: 'run', title: 'Tirada Larga con Ritmo Maratón',
      distance: km, intensity: 'moderate',
      description: `${km} km. Estructura: ${Math.round(km * 0.3)} km suave → ${Math.round(km * 0.4)} km a ritmo maratón objetivo → ${mpKm} km a ritmo suave. Practica la nutrición igual que el día de carrera (gel, agua).`,
      warmup: '5 min caminata', cooldown: '10 min caminata + 20 min estiramientos'
    }
  }
  return {
    type: 'run', title: 'Tirada Larga (Tapering)',
    distance: km, intensity: 'easy',
    description: `${km} km suave. El volumen baja pero la calidad se mantiene. Las piernas estarán frescas. Corre lo justo, no te excedas: el trabajo está hecho.`,
    warmup: '5 min caminata', cooldown: '10 min estiramientos'
  }
}

function getMondayWorkout(week) {
  if (week === 52) return { type: 'rest', title: 'Descanso pre-carrera', description: 'Día de descanso total. Come bien, hidrata, revisa el equipo para mañana y duerme.' }
  const phase = getStrengthPhase(week)
  const data = STRENGTH.push[phase]
  return { type: 'strength', ...data }
}

function getWednesdayWorkout(week) {
  if (week === 52) return { type: 'rest', title: 'Descanso', description: 'Descanso total. Haz algo de movilidad suave si quieres. Concéntrate en la nutrición y el sueño.' }
  const phase = getStrengthPhase(week)
  const data = STRENGTH.legs[phase]
  return { type: 'strength', ...data }
}

function getFridayWorkout(week) {
  if (week === 52) return { type: 'rest', title: 'Descanso total', description: 'Día clave de descanso. No hagas nada físico. Prepara la bolsa, pon el despertador y descansa.' }
  const phase = getStrengthPhase(week)
  const data = STRENGTH.pull[phase]
  return { type: 'strength', ...data }
}

function getSundayWorkout(week) {
  if (week === 52) return { type: 'rest', title: 'Recuperación post-maratón', description: '¡Lo lograste! Hoy solo camina suave, hidrata bien y celebra. Tus músculos necesitan 1-2 semanas para recuperarse completamente.' }
  return { type: 'rest', title: 'Descanso', description: 'Día de recuperación activa. Puedes hacer una caminata suave, natación ligera o estiramientos. Lo importante es descansar.' }
}

export function getWeekWorkouts(week) {
  return {
    monday: getMondayWorkout(week),
    tuesday: getTuesdayWorkout(week),
    wednesday: getWednesdayWorkout(week),
    thursday: getThursdayWorkout(week),
    friday: getFridayWorkout(week),
    saturday: getSaturdayWorkout(week),
    sunday: getSundayWorkout(week)
  }
}

export function getWeekDates(startDate, weekNumber) {
  const start = new Date(startDate)
  const weekStart = new Date(start)
  weekStart.setDate(start.getDate() + (weekNumber - 1) * 7)
  const days = {}
  const keys = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
  keys.forEach((k, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    days[k] = d.toISOString().split('T')[0]
  })
  return days
}

export function getCurrentWeek(startDate) {
  const start = new Date(startDate)
  const now = new Date()
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24 * 7))
  return Math.max(1, Math.min(52, diff + 1))
}

export function getWeeklyKm(week) {
  return (TUE_KM[week] || 0) + (THU_KM[week] || 0) + (LONG_RUN[week] || 0)
}

export const DAY_LABELS = {
  monday: 'Lun', tuesday: 'Mar', wednesday: 'Mié',
  thursday: 'Jue', friday: 'Vie', saturday: 'Sáb', sunday: 'Dom'
}

export const DAY_FULL = {
  monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
  thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
}
