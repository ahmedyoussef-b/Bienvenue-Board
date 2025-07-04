
// prisma/seed.ts
import { PrismaClient, Role, UserSex, Day } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const HASH_ROUNDS = 10;

async function main() {
  console.log('--- Début du seeding réaliste ---');

  // 1. Nettoyage de la base de données
  console.log('Nettoyage des anciennes données...');
  await prisma.attendance.deleteMany({});
  await prisma.result.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.exam.deleteMany({});
  // Check if LessonRequirement model exists before deleting
  if (prisma.lessonRequirement) {
    await prisma.lessonRequirement.deleteMany({});
  }
  await prisma.announcement.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.parent.deleteMany({});
  await prisma.teacher.deleteMany({});
  await prisma.admin.deleteMany({});
  await prisma.class.deleteMany({});
  await prisma.grade.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.classroom.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Anciennes données supprimées.');

  // 2. Création de l'utilisateur Administrateur
  console.log('Création de l\'administrateur...');
  const hashedPassword = await bcrypt.hash('password123', HASH_ROUNDS);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      username: 'admin',
      password: hashedPassword,
      role: Role.ADMIN,
      name: 'Admin Principal',
      active: true,
    },
  });
  await prisma.admin.create({
    data: {
      userId: adminUser.id,
      name: 'Admin',
      surname: 'Principal',
      phone: '0123456789',
    },
  });
  console.log('Administrateur créé.');

  // 3. Création des Niveaux (Grades)
  console.log('Création des niveaux...');
  const gradesData = [{ level: 7 }, { level: 8 }, { level: 9 }];
  const grades = await Promise.all(
    gradesData.map((grade) => prisma.grade.create({ data: grade }))
  );
  console.log('Niveaux créés.');

  // 4. Création des Salles de classe
  console.log('Création des salles de classe...');
  const classrooms = [];
  for (let i = 1; i <= 22; i++) {
    classrooms.push(await prisma.classroom.create({ data: { name: `Salle ${i}`, capacity: 30, building: 'Principal' } }));
  }
  for (let i = 1; i <= 2; i++) {
    classrooms.push(await prisma.classroom.create({ data: { name: `Labo Science ${i}`, capacity: 30, building: 'Sciences' } }));
    classrooms.push(await prisma.classroom.create({ data: { name: `Labo Physique ${i}`, capacity: 30, building: 'Sciences' } }));
    classrooms.push(await prisma.classroom.create({ data: { name: `Labo Technique ${i}`, capacity: 30, building: 'Technique' } }));
    classrooms.push(await prisma.classroom.create({ data: { name: `Labo Informatique ${i}`, capacity: 30, building: 'Informatique' } }));
  }
  console.log(`${classrooms.length} salles créées.`);

  // 5. Création des Matières
  console.log('Création des matières...');
  const subjectNames = [
    'MATHEMATIQUE', 'FRANCAIS', 'ARABE', 'ANGLAIS', 'SCIENCES', 'PHYSIQUE',
    'INFORMATIQUE', 'HISTOIRE', 'GEOGRAPHY', 'EDUCATION CIVILE', 'EDUCATION RELIGIEUSE',
    'ART', 'MUSIQUE', 'EDUCATION SPORTIVE'
  ];
  const subjects = await Promise.all(
    subjectNames.map((name) => prisma.subject.create({ data: { name, weeklyHours: 2, coefficient: 1 } }))
  );
  const subjectMap = new Map(subjects.map((s) => [s.name, s]));
  console.log('Matières créées.');

  // 6. Création des Classes par niveau
  console.log('Création des classes...');
  const classesByGrade: { [key: number]: any[] } = { 7: [], 8: [], 9: [] };
  const classCounts: { [key: number]: number } = { 7: 12, 8: 11, 9: 6 };
  for (const grade of grades) {
    for (let i = 1; i <= classCounts[grade.level]; i++) {
      const newClass = await prisma.class.create({
        data: {
          name: `${grade.level}ème Base ${i}`,
          capacity: 30,
          gradeId: grade.id,
        },
      });
      classesByGrade[grade.level].push(newClass);
    }
  }
  console.log('Classes créées.');

  // 7. Création des Professeurs
  console.log('Création des professeurs...');
  const createdTeachers = [];

  // Professeurs spécialisés
  for (let i = 1; i <= 4; i++) {
    const user = await prisma.user.create({ data: { email: `prof.sport${i}@example.com`, username: `prof.sport${i}`, password: hashedPassword, role: Role.TEACHER, name: `Prof Sport ${i}`, active: true } });
    createdTeachers.push(await prisma.teacher.create({ data: { userId: user.id, name: 'Professeur', surname: `Sportif ${i}`, sex: UserSex.MALE, birthday: new Date(), bloodType: 'A+', subjects: { connect: { id: subjectMap.get('EDUCATION SPORTIVE')!.id } } } }));
  }
  for (let i = 1; i <= 2; i++) {
    const user = await prisma.user.create({ data: { email: `prof.musi${i}@example.com`, username: `prof.musi${i}`, password: hashedPassword, role: Role.TEACHER, name: `Prof Musique ${i}`, active: true } });
    createdTeachers.push(await prisma.teacher.create({ data: { userId: user.id, name: 'Professeur', surname: `Musical ${i}`, sex: UserSex.FEMALE, birthday: new Date(), bloodType: 'B+', subjects: { connect: { id: subjectMap.get('MUSIQUE')!.id } } } }));
  }
  const artUser = await prisma.user.create({ data: { email: 'prof.art1@example.com', username: 'prof.art1', password: hashedPassword, role: Role.TEACHER, name: 'Prof Art 1', active: true } });
  createdTeachers.push(await prisma.teacher.create({ data: { userId: artUser.id, name: 'Professeur', surname: 'Artiste', sex: UserSex.FEMALE, birthday: new Date(), bloodType: 'AB+', subjects: { connect: { id: subjectMap.get('ART')!.id } } } }));

  // Professeurs pour les autres matières
  const coreSubjects = subjects.filter(s => !['EDUCATION SPORTIVE', 'MUSIQUE', 'ART'].includes(s.name));
  for (const subject of coreSubjects) {
    for (let i = 1; i <= 3; i++) {
      const sanitizedSubjectName = subject.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const username = `prof.${sanitizedSubjectName}${i}`;
      const user = await prisma.user.create({ data: { email: `${username}@example.com`, username: username, password: hashedPassword, role: Role.TEACHER, name: `Prof ${subject.name} ${i}`, active: true } });
      createdTeachers.push(await prisma.teacher.create({ data: { userId: user.id, name: 'Professeur', surname: `${subject.name} ${i}`, sex: i % 2 === 0 ? UserSex.FEMALE : UserSex.MALE, birthday: new Date(), bloodType: 'O-', subjects: { connect: { id: subject.id } } } }));
    }
  }
  console.log(`${createdTeachers.length} professeurs créés.`);

  // 8. Création des Parents et Étudiants
  console.log('Création des parents et étudiants...');
  let studentCounter = 0;
  const allSystemClasses = Object.values(classesByGrade).flat();
  const totalStudents = allSystemClasses.reduce((acc, cls) => acc + cls.capacity, 0);

  const parents = [];
  for (let i = 1; i <= totalStudents; i++) {
      const parentUser = await prisma.user.create({ data: { email: `parent${i}@example.com`, username: `parent${i}`, password: hashedPassword, role: Role.PARENT, name: `Parent ${i}`, active: true } });
      parents.push(await prisma.parent.create({ data: { userId: parentUser.id, name: `ParentPrénom ${i}`, surname: `ParentNom ${i}` } }));
  }

  for (const cls of allSystemClasses) {
    for (let i = 1; i <= cls.capacity; i++) {
      const studentUser = await prisma.user.create({ data: { email: `etudiant${studentCounter + 1}@example.com`, username: `etudiant${studentCounter + 1}`, password: hashedPassword, role: Role.STUDENT, name: `Etudiant ${studentCounter + 1}`, active: true } });
      await prisma.student.create({
        data: {
          userId: studentUser.id,
          name: `EtudiantPrénom ${studentCounter + 1}`,
          surname: `EtudiantNom ${studentCounter + 1}`,
          birthday: new Date('2010-01-01'),
          sex: i % 2 === 0 ? UserSex.FEMALE : UserSex.MALE,
          bloodType: 'O+',
          classId: cls.id,
          gradeId: cls.gradeId!,
          parentId: parents[studentCounter].id,
        },
      });
      studentCounter++;
    }
  }
  console.log(`${parents.length} parents et ${studentCounter} étudiants créés.`);
  
  // 9. Ajout de données exemples pour Annonces et Événements
  console.log("Ajout d'annonces et d'événements exemples...");
  await prisma.announcement.create({
    data: {
      title: "Réunion parents-professeurs",
      description: "La réunion annuelle parents-professeurs aura lieu la semaine prochaine.",
      date: new Date(),
    }
  });
  await prisma.event.create({
    data: {
      title: "Fête de fin d'année",
      description: "Célébration de la fin de l'année scolaire dans la cour de l'école.",
      startTime: new Date(new Date().setDate(new Date().getDate() + 7)),
      endTime: new Date(new Date().setDate(new Date().getDate() + 7) + 2 * 60 * 60 * 1000),
    }
  });
  console.log("Données exemples ajoutées.");
  
  console.log('--- Seeding réaliste terminé avec succès ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
