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
    series: 'Dune',
    issueNumber: 1,
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
    series: 'Middle-earth',
    issueNumber: 1,
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
    series: 'Foundation',
    issueNumber: 1,
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
    series: 'Mistborn',
    issueNumber: 1,
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
  {
    title: 'Dune Messiah',
    author: 'Frank Herbert',
    kind: 'BOOK',
    genre: 'Science fiction',
    year: 1969,
    series: 'Dune',
    issueNumber: 2,
    synopsis:
      'Twelve years after his victory, Paul Atreides rules the known universe as emperor while a jihad waged in his name spreads across the stars. A conspiracy of old enemies plots to bring him down using his own prescience against him. The sequel turns the heroic myth of the first novel into a dark reflection on power.',
  },
  {
    title: 'Children of Dune',
    author: 'Frank Herbert',
    kind: 'BOOK',
    genre: 'Science fiction',
    year: 1976,
    series: 'Dune',
    issueNumber: 3,
    synopsis:
      'Paul\'s twin children, Leto and Ghanima, grow up on Arrakis with inherited memories and prescient powers. Their aunt Alia is slipping toward possession while rival factions scheme for the throne. Leto must choose a terrible path to secure humanity\'s future.',
  },
  {
    title: 'Foundation and Empire',
    author: 'Isaac Asimov',
    kind: 'BOOK',
    genre: 'Science fiction',
    year: 1952,
    series: 'Foundation',
    issueNumber: 2,
    synopsis:
      'The young Foundation faces a general of the dying Galactic Empire who wants to bring it to heel. Later a mutant known as the Mule appears, whose powers upset every prediction of psychohistory. The book shows that even the best plan can be derailed by a single individual.',
  },
  {
    title: 'Second Foundation',
    author: 'Isaac Asimov',
    kind: 'BOOK',
    genre: 'Science fiction',
    year: 1953,
    series: 'Foundation',
    issueNumber: 3,
    synopsis:
      'The Mule is hunting for the mysterious Second Foundation, a group of mentalists said to guard the future of the galaxy. Different characters search for it while discovering that appearances can deceive. The closing volume of the original trilogy resolves the fate of Hari Seldon\'s plan.',
  },
  {
    title: 'The Well of Ascension',
    author: 'Brandon Sanderson',
    kind: 'BOOK',
    genre: 'Fantasy',
    year: 2007,
    series: 'Mistborn',
    issueNumber: 2,
    synopsis:
      'With the Lord Ruler gone, Elend Venture tries to rule Luthadel while armies besiege the city. Vin must protect the new government and face a mysterious force linked to the old prophecies. The novel explores leadership, loyalty and the cost of building a better order.',
  },
  {
    title: 'The Hero of Ages',
    author: 'Brandon Sanderson',
    kind: 'BOOK',
    genre: 'Fantasy',
    year: 2008,
    series: 'Mistborn',
    issueNumber: 3,
    synopsis:
      'The world is ending as ash falls, earthquakes strike and the mist behaves strangely. Vin and Elend search for the truth behind the prophecies and face the entity that threatens everything. The final novel of the trilogy ties together its mysteries with a large-scale conclusion.',
  },
  {
    title: 'The Fellowship of the Ring',
    author: 'J.R.R. Tolkien',
    kind: 'BOOK',
    genre: 'Fantasy',
    year: 1954,
    series: 'The Lord of the Rings',
    issueNumber: 1,
    synopsis:
      'Frodo Baggins inherits a ring that turns out to be the instrument of the dark lord Sauron. A fellowship of hobbits, men, an elf, a dwarf and a wizard sets out to destroy it in the fires of Mount Doom. The first volume mixes a quiet start in the Shire with the first perils of the road.',
  },
  {
    title: 'The Two Towers',
    author: 'J.R.R. Tolkien',
    kind: 'BOOK',
    genre: 'Fantasy',
    year: 1954,
    series: 'The Lord of the Rings',
    issueNumber: 2,
    synopsis:
      'The Fellowship is broken, and its members follow separate paths while the war for Middle-earth intensifies. Frodo and Sam head toward Mordor with the treacherous Gollum as their guide, as Aragorn and his allies defend Rohan. The second volume combines epic battles with the lonely journey of the ring-bearer.',
  },
  {
    title: 'The Return of the King',
    author: 'J.R.R. Tolkien',
    kind: 'BOOK',
    genre: 'Fantasy',
    year: 1955,
    series: 'The Lord of the Rings',
    issueNumber: 3,
    synopsis:
      'The armies of Gondor and Rohan face Sauron\'s forces at the gates of Minas Tirith, while Frodo and Sam struggle through Mordor. Aragorn claims his destiny and the fate of the ring is decided at Mount Doom. The final volume closes the trilogy with victory, loss and a bittersweet farewell.',
  },
  {
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    kind: 'BOOK',
    genre: 'Romance',
    year: 1813,
    synopsis:
      'Elizabeth Bennet, the witty second daughter of a country family, clashes with the proud and wealthy Mr. Darcy. Misunderstandings, social expectations and family scandals test both of them before they see each other clearly. The novel is a sharp, funny portrait of class and marriage in Regency England.',
  },
  {
    title: 'Dracula',
    author: 'Bram Stoker',
    kind: 'BOOK',
    genre: 'Gothic horror',
    year: 1897,
    synopsis:
      'The solicitor Jonathan Harker travels to Transylvania to close a property deal with Count Dracula and discovers his host is a vampire. The Count follows to England, preying on those Harker loves. A band of friends led by Professor Van Helsing sets out to destroy him in a story told through letters and diaries.',
  },
  {
    title: 'The Shining',
    author: 'Stephen King',
    kind: 'BOOK',
    genre: 'Horror',
    year: 1977,
    synopsis:
      'Jack Torrance takes a job as winter caretaker of the isolated Overlook Hotel, hoping to recover from his struggles with alcohol and writer\'s block. His young son Danny has psychic gifts that make the hotel\'s dark past come alive. As the snow traps them, the building slowly pushes Jack toward madness.',
  },
  {
    title: 'Gone Girl',
    author: 'Gillian Flynn',
    kind: 'BOOK',
    genre: 'Thriller',
    year: 2012,
    synopsis:
      'On the morning of their fifth anniversary, Amy Dunne disappears and suspicion falls on her husband Nick. Alternating between his account and her diary, the novel reveals a marriage full of lies. It is a twisting psychological thriller about image, media and manipulation.',
  },
  {
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    kind: 'BOOK',
    genre: 'Non-fiction',
    year: 2011,
    synopsis:
      'The book traces the history of Homo sapiens from the Stone Age to the present. It argues that shared myths such as money, nations and religion let large groups cooperate and shaped our societies. It is an accessible synthesis of anthropology, economics and history that raises questions about the future.',
  },
  {
    title: 'The Road',
    author: 'Cormac McCarthy',
    kind: 'BOOK',
    genre: 'Post-apocalyptic',
    year: 2006,
    synopsis:
      'A father and his young son walk through a burned America covered in ash, heading south toward the coast. They scavenge for food and avoid desperate survivors, holding on to each other and to the idea of carrying the fire. The spare, haunting novel is a meditation on love and survival.',
  },
  {
    title: 'Saga, Vol. 2',
    author: 'Brian K. Vaughan',
    kind: 'COMIC',
    genre: 'Space opera',
    year: 2013,
    series: 'Saga',
    issueNumber: 2,
    synopsis:
      'Alana, Marko and their baby Hazel keep running from assassins and bounty hunters while visiting Marko\'s parents. New allies and enemies join the chase as the family searches for a place to rest. The second volume deepens the humor, the violence and the tenderness of the series.',
  },
  {
    title: 'Saga, Vol. 3',
    author: 'Brian K. Vaughan',
    kind: 'COMIC',
    genre: 'Space opera',
    year: 2014,
    series: 'Saga',
    issueNumber: 3,
    synopsis:
      'The family settles briefly on a planet where Marko tries to rebuild his bond with Alana and the baby. Meanwhile The Will and the journalists investigating the war close in on the truth about their flight. The volume explores the cost of choosing love over war.',
  },
  {
    title: 'The Sandman, Vol. 2: The Doll\'s House',
    author: 'Neil Gaiman',
    kind: 'COMIC',
    genre: 'Dark fantasy',
    year: 1990,
    series: 'The Sandman',
    issueNumber: 2,
    synopsis:
      'Morpheus hunts the dreams and nightmares that escaped during his captivity, and a young woman named Rose Walker turns out to be a rare vortex in the dream world. Her search for her missing brother crosses the paths of serial killers and strange guests. This volume deepens the mythology of the Endless.',
  },
  {
    title: 'The Sandman, Vol. 3: Dream Country',
    author: 'Neil Gaiman',
    kind: 'COMIC',
    genre: 'Dark fantasy',
    year: 1991,
    series: 'The Sandman',
    issueNumber: 3,
    synopsis:
      'This collection gathers four standalone stories, including a tale of a cursed writer, a performance of A Midsummer Night\'s Dream before fairies and an account from the point of view of cats. Each issue shows the Lord of Dreams in a different light. It is considered a showcase of the series\' range.',
  },
  {
    title: 'Y: The Last Man, Vol. 2: Cycles',
    author: 'Brian K. Vaughan',
    kind: 'COMIC',
    genre: 'Post-apocalyptic',
    year: 2003,
    series: 'Y: The Last Man',
    issueNumber: 2,
    synopsis:
      'Yorick, his protector Agent 355 and Dr. Mann continue their trip toward Boston while bounty hunters and new factions pursue them. A stop in a women-led community exposes how the world has reorganized. The volume mixes tension and dark humor as the mystery of the plague deepens.',
  },
  {
    title: 'Y: The Last Man, Vol. 3: One Small Step',
    author: 'Brian K. Vaughan',
    kind: 'COMIC',
    genre: 'Post-apocalyptic',
    year: 2004,
    series: 'Y: The Last Man',
    issueNumber: 3,
    synopsis:
      'While Yorick and his companions keep traveling, the crew of the International Space Station learns about the plague from orbit and must decide whether to return to a changed Earth. The volume widens the scope of the story from the ruined planet to space, and raises questions about who survived and why.',
  },
  {
    title: 'Bone, Vol. 2: The Great Cow Race',
    author: 'Jeff Smith',
    kind: 'COMIC',
    genre: 'Fantasy',
    year: 1996,
    series: 'Bone',
    issueNumber: 2,
    synopsis:
      'Fone Bone and Thorn take refuge at a farm where Gran\'ma Ben is training for the annual great cow race. Smiley and Phoney Bone get mixed up in the competition while dark forces keep hunting for Thorn. The volume balances broad comedy with the growing threat of the Hooded One.',
  },
  {
    title: 'Bone, Vol. 3: Eyes of the Storm',
    author: 'Jeff Smith',
    kind: 'COMIC',
    genre: 'Fantasy',
    year: 1996,
    series: 'Bone',
    issueNumber: 3,
    synopsis:
      'Thorn and the Bone cousins travel to a distant city while the rat creatures and the Lord of the Locusts close in. Fone Bone learns more about the dragon and the dreams that haunt Thorn. The third volume raises the stakes of the quest and introduces key figures of the valley.',
  },
  {
    title: 'Ms. Marvel, Vol. 2: Generation Why',
    author: 'G. Willow Wilson',
    kind: 'COMIC',
    genre: 'Superhero',
    year: 2015,
    series: 'Ms. Marvel',
    issueNumber: 2,
    synopsis:
      'Kamala Khan discovers that a villain named the Inventor is kidnapping teenagers from her city. She must stop him while managing school, friends and the secret of her identity. The second volume also brings her face to face with an old Marvel icon.',
  },
  {
    title: 'Hellboy, Vol. 1: Seed of Destruction',
    author: 'Mike Mignola',
    kind: 'COMIC',
    genre: 'Supernatural',
    year: 1994,
    series: 'Hellboy',
    issueNumber: 1,
    synopsis:
      'Hellboy is a demon summoned to Earth by Nazi occultists and raised by the Bureau for Paranormal Research and Defense. The agency sends him to investigate a creature linked to Rasputin and to his own origins. The comic combines pulp horror, folklore and a gruff sense of humor.',
  },
  {
    title: 'Batman: Year One',
    author: 'Frank Miller',
    kind: 'COMIC',
    genre: 'Superhero',
    year: 1987,
    synopsis:
      'A young Bruce Wayne returns to Gotham after years abroad and begins his fight against crime, while James Gordon arrives as an honest new lieutenant in a corrupt police force. Both men\'s stories intertwine as they face the city\'s gangsters and crooked cops. It is a realistic, noir retelling of the hero\'s origin.',
  },
  {
    title: 'Locke & Key, Vol. 1: Welcome to Lovecraft',
    author: 'Joe Hill',
    kind: 'COMIC',
    genre: 'Horror',
    year: 2008,
    series: 'Locke & Key',
    issueNumber: 1,
    synopsis:
      'After their father is murdered, the Locke siblings move into the family house, called Keyhouse, in Lovecraft, Massachusetts. They find strange keys that open doors with magical powers, but a menacing presence also wants them. The series blends family drama with chilling fantasy.',
  },
  {
    title: 'Scott Pilgrim, Vol. 1: Precious Little Life',
    author: 'Bryan Lee O\'Malley',
    kind: 'COMIC',
    genre: 'Comedy',
    year: 2004,
    series: 'Scott Pilgrim',
    issueNumber: 1,
    synopsis:
      'Scott Pilgrim, a slacker bassist in Toronto, falls for the mysterious Ramona Flowers and learns he must defeat her seven evil exes to date her. The story mixes indie romance, video game logic and band rehearsals. It is a funny, stylish comic about growing up.',
  },
  {
    title: 'Blankets',
    author: 'Craig Thompson',
    kind: 'COMIC',
    genre: 'Memoir',
    year: 2003,
    synopsis:
      'Craig recalls growing up in a strict evangelical family in rural Wisconsin, his bond with his younger brother and his first love, Raina. The graphic novel explores faith, doubt and the pain and joy of adolescence. Its fluid black-and-white drawings made it a landmark of autobiographical comics.',
  },
  {
    title: 'Sin City, Vol. 1: The Hard Goodbye',
    author: 'Frank Miller',
    kind: 'COMIC',
    genre: 'Crime noir',
    year: 1991,
    series: 'Sin City',
    issueNumber: 1,
    synopsis:
      'Marv, a brutal ex-convict, sets out to avenge the murder of Goldie, the only woman who was ever kind to him. His rampage through the corrupt Basin City leads to a conspiracy of powerful people. The stark black-and-white art defines the noir comic.',
  },
];
