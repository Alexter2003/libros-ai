import type { Kind } from '@prisma/client';

export interface SeedItem {
  title: string;
  author: string;
  kind: Kind;
  genre: string;
  year: number;
  synopsis: string;
  isbn?: string;
  series?: string;
  issueNumber?: number;
}

export function coverSlug(item: Pick<SeedItem, 'title'>): string {
  return item.title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const SEED_ITEMS: SeedItem[] = [
  {
    title: 'Dune',
    author: 'Frank Herbert',
    kind: 'BOOK',
    genre: 'Science fiction',
    year: 1965,
    isbn: '9780441013593',
    synopsis:
      'On the desert planet Arrakis, the only source of the spice melange, young Paul Atreides sees his noble house destroyed by betrayal. He survives among the native Fremen and grows into a messianic leader. The novel weaves ecology, religion and political intrigue into a vast interstellar saga.',
  },
  {
    title: '1984',
    author: 'George Orwell',
    kind: 'BOOK',
    genre: 'Dystopian fiction',
    year: 1949,
    isbn: '9780451524935',
    synopsis:
      'Winston Smith works at the Ministry of Truth rewriting history for the all-seeing Party led by Big Brother. His secret diary and a forbidden love affair become acts of rebellion in a society of total surveillance. The book is a landmark warning about propaganda and authoritarian control.',
  },
  {
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    kind: 'BOOK',
    genre: 'Fantasy',
    year: 1937,
    isbn: '9780547928227',
    synopsis:
      'Bilbo Baggins, a comfort-loving hobbit, is swept into a quest with the wizard Gandalf and thirteen dwarves to reclaim a treasure guarded by the dragon Smaug. Along the way he finds courage, cunning and a mysterious ring. It is the lighthearted prelude to The Lord of the Rings.',
  },
  {
    title: 'Foundation',
    author: 'Isaac Asimov',
    kind: 'BOOK',
    genre: 'Science fiction',
    year: 1951,
    isbn: '9780553293357',
    synopsis:
      'Mathematician Hari Seldon predicts the fall of the Galactic Empire and a thirty-thousand-year dark age. He founds a colony of scholars meant to shorten the collapse to one thousand years. The story follows how science, trade and religion shape the survival of the Foundation.',
  },
  {
    title: 'Neuromancer',
    author: 'William Gibson',
    kind: 'BOOK',
    genre: 'Cyberpunk',
    year: 1984,
    isbn: '9780441569595',
    synopsis:
      'Case, a washed-up hacker, is hired for one last job that could restore his ability to jack into cyberspace. He teams up with a street samurai and a rogue artificial intelligence. The novel defined the cyberpunk genre and popularized the idea of the matrix.',
  },
  {
    title: 'The Name of the Wind',
    author: 'Patrick Rothfuss',
    kind: 'BOOK',
    genre: 'Fantasy',
    year: 2007,
    isbn: '9780756404741',
    synopsis:
      'Kvothe, now a humble innkeeper, tells the true story of his life: an orphaned prodigy who becomes a legendary arcanist, musician and thief. His tale covers the University, a thirst for knowledge and the search for those who killed his troupe. It is the first part of The Kingkiller Chronicle.',
  },
  {
    title: 'Frankenstein',
    author: 'Mary Shelley',
    kind: 'BOOK',
    genre: 'Gothic fiction',
    year: 1818,
    isbn: '9780486282114',
    synopsis:
      'Victor Frankenstein, driven by scientific ambition, creates a living being from dead matter and then abandons it in horror. The rejected creature seeks companionship and revenge, forcing his maker to face the consequences. It is a foundational work of science fiction and a meditation on responsibility.',
  },
  {
    title: 'Good Omens',
    author: 'Neil Gaiman and Terry Pratchett',
    kind: 'BOOK',
    genre: 'Comic fantasy',
    year: 1990,
    isbn: '9780060853983',
    synopsis:
      'An angel and a demon who have grown fond of life on Earth try to prevent the coming of the Apocalypse. The Antichrist has been misplaced at birth and grows up as an ordinary boy. This comic novel mixes British humor with prophecy and end-of-the-world chaos.',
  },
  {
    title: 'Fahrenheit 451',
    author: 'Ray Bradbury',
    kind: 'BOOK',
    genre: 'Dystopian fiction',
    year: 1953,
    isbn: '9781451673319',
    synopsis:
      'Guy Montag is a fireman whose job is to burn books in a future where reading is outlawed and entertainment is constant. A curious young neighbor makes him question his work and his empty life. The novel is a defense of literature against censorship and mindless media.',
  },
  {
    title: 'The Left Hand of Darkness',
    author: 'Ursula K. Le Guin',
    kind: 'BOOK',
    genre: 'Science fiction',
    year: 1969,
    isbn: '9780441478125',
    synopsis:
      'Genly Ai, an envoy from an interstellar league, travels to the frozen world of Gethen to persuade its people to join. Its inhabitants have no fixed sex, which challenges every assumption he carries. A journey across the ice with an exiled native becomes a story about trust and identity.',
  },
  {
    title: 'Mistborn: The Final Empire',
    author: 'Brandon Sanderson',
    kind: 'BOOK',
    genre: 'Fantasy',
    year: 2006,
    isbn: '9780765311788',
    synopsis:
      'In a world of ash and mist ruled for a thousand years by an immortal Lord Ruler, a street thief named Vin discovers she can burn metals to gain magical powers. She joins a crew planning to overthrow the empire. The story is known for its inventive magic system and its heist structure.',
  },
  {
    title: 'The Martian',
    author: 'Andy Weir',
    kind: 'BOOK',
    genre: 'Science fiction',
    year: 2011,
    isbn: '9780553418026',
    synopsis:
      'Astronaut Mark Watney is stranded alone on Mars after his crew believes him dead and leaves. Using botany, chemistry and sheer humor, he finds ways to survive until a rescue can be organized. The novel is celebrated for its realistic science and its resourceful hero.',
  },
  {
    title: 'Watchmen',
    author: 'Alan Moore',
    kind: 'COMIC',
    genre: 'Superhero',
    year: 1987,
    isbn: '9780930289232',
    synopsis:
      'In an alternate 1985 where costumed heroes are outlawed and nuclear war looms, the murder of a former hero triggers an investigation by the vigilante Rorschach. The story deconstructs superhero myths through morally ambiguous characters. Drawn by Dave Gibbons, it is considered one of the greatest graphic novels ever made.',
  },
  {
    title: 'Maus',
    author: 'Art Spiegelman',
    kind: 'COMIC',
    genre: 'Memoir',
    year: 1991,
    isbn: '9780679406419',
    synopsis:
      'The author interviews his father, a Polish Jew who survived the Holocaust, and retells his story with Jews drawn as mice and Nazis as cats. The narrative moves between wartime horror and the strained father-son relationship in the present. It was the first graphic novel to win a Pulitzer Prize.',
  },
  {
    title: 'V for Vendetta',
    author: 'Alan Moore',
    kind: 'COMIC',
    genre: 'Dystopian fiction',
    year: 1988,
    isbn: '9781401207922',
    synopsis:
      'In a fascist Britain of the near future, a masked anarchist known as V wages a theatrical campaign against the regime. He takes a young woman named Evey under his wing and challenges her view of freedom. Illustrated by David Lloyd, it is a study of power, resistance and identity.',
  },
  {
    title: 'Batman: The Dark Knight Returns',
    author: 'Frank Miller',
    kind: 'COMIC',
    genre: 'Superhero',
    year: 1986,
    isbn: '9781563893421',
    synopsis:
      'An aging Bruce Wayne comes out of retirement to fight crime in a violent, decaying Gotham. His return reignites old rivalries with the Joker and brings him into conflict with the government and Superman. The book reshaped the tone of superhero comics toward darker, mature storytelling.',
  },
  {
    title: 'Saga, Vol. 1',
    author: 'Brian K. Vaughan',
    kind: 'COMIC',
    genre: 'Space opera',
    year: 2012,
    isbn: '9781607066019',
    series: 'Saga',
    issueNumber: 1,
    synopsis:
      'Alana and Marko, soldiers from two worlds locked in an endless war, fall in love and have a daughter. Hunted by both sides, the family flees across the galaxy in search of safety. Fiona Staples illustrates this mix of romance, humor and violence about parenthood in wartime.',
  },
  {
    title: 'The Sandman, Vol. 1: Preludes & Nocturnes',
    author: 'Neil Gaiman',
    kind: 'COMIC',
    genre: 'Dark fantasy',
    year: 1989,
    isbn: '9781563890116',
    series: 'The Sandman',
    issueNumber: 1,
    synopsis:
      'Morpheus, the Lord of Dreams, is captured by an occult ritual and held prisoner for seventy years. After escaping, he sets out to recover his stolen tools of power and rebuild his kingdom. The opening volume introduces a mythic world of dreams, gods and nightmares.',
  },
  {
    title: 'Persepolis',
    author: 'Marjane Satrapi',
    kind: 'COMIC',
    genre: 'Memoir',
    year: 2000,
    isbn: '9780375714832',
    synopsis:
      'The author recounts her childhood and youth in Tehran during the Islamic Revolution and the war with Iraq. Her story follows a headstrong girl who grows up between family, politics and exile in Europe. The black-and-white art gives a personal, humorous voice to a turbulent period.',
  },
  {
    title: 'Ms. Marvel, Vol. 1: No Normal',
    author: 'G. Willow Wilson',
    kind: 'COMIC',
    genre: 'Superhero',
    year: 2014,
    isbn: '9780785190219',
    series: 'Ms. Marvel',
    issueNumber: 1,
    synopsis:
      'Kamala Khan, a Pakistani-American teenager from Jersey City, gains shape-shifting powers and takes up the mantle of her hero Ms. Marvel. She balances family expectations, faith and school with her new responsibilities. The series is praised for its warm humor and fresh perspective.',
  },
  {
    title: 'Y: The Last Man, Vol. 1: Unmanned',
    author: 'Brian K. Vaughan',
    kind: 'COMIC',
    genre: 'Post-apocalyptic',
    year: 2003,
    series: 'Y: The Last Man',
    issueNumber: 1,
    synopsis:
      'A mysterious plague kills every mammal with a Y chromosome except Yorick Brown and his pet monkey. He sets out across a changed world to find his girlfriend and discover why he survived. The volume mixes road-trip adventure with questions about gender and society.',
  },
  {
    title: 'Fun Home',
    author: 'Alison Bechdel',
    kind: 'COMIC',
    genre: 'Memoir',
    year: 2006,
    isbn: '9780618871711',
    synopsis:
      'Alison Bechdel explores her complicated relationship with her father, a funeral home director and English teacher who hid his own secrets. The memoir interweaves literature, family history and her own coming out. It is a moving and meticulously drawn account of identity and loss.',
  },
  {
    title: 'Akira, Vol. 1',
    author: 'Katsuhiro Otomo',
    kind: 'COMIC',
    genre: 'Manga',
    year: 1984,
    isbn: '9781935429005',
    series: 'Akira',
    issueNumber: 1,
    synopsis:
      'In a post-apocalyptic Neo-Tokyo, the biker Kaneda sees his friend Tetsuo awaken terrifying psychic powers after an encounter with a secret government project. The military and rival factions race to control the boy and the legendary force called Akira. This manga helped bring Japanese comics to a global audience.',
  },
  {
    title: 'Bone, Vol. 1: Out from Boneville',
    author: 'Jeff Smith',
    kind: 'COMIC',
    genre: 'Fantasy',
    year: 1991,
    isbn: '9780439706407',
    series: 'Bone',
    issueNumber: 1,
    synopsis:
      'The three Bone cousins are run out of Boneville and end up lost in a mysterious valley full of strange creatures. Fone Bone befriends a young woman named Thorn and uncovers an ancient threat hidden in the forest. The series blends slapstick cartoon humor with epic fantasy.',
  },
];
