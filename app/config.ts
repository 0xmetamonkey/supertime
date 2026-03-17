export const TEAM_MEMBERS = [
  { username: '0xmetamonkey', email: '0xmetamonkey@gmail.com' },
  { username: 'extsystudios', email: 'extsystudios@gmail.com' },
  { username: 'lifeofaman01', email: 'lifeofaman01@gmail.com' },
  { username: 'ayinlong', email: 'ayinlong@gmail.com' },
  { username: 'Supertime AI', email: 'bot@supertime.wtf' }
];

export const TEAM_EMAILS = TEAM_MEMBERS.map(m => m.email);

export const ADMIN_EMAILS = [
  '0xmetamonkey@gmail.com' // Restrict full admin access to owner
];
