import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { closeDatabase, query } from '../db/index.js';
import { runMigrations } from '../db/migrate.js';
import { hashPassword } from '../lib/password.js';
import { userRepository } from '../repositories/user.repository.js';
import { demoBooks, demoMessages, demoUsers } from './seed-data.js';

const TONES = ['blue', 'orange', 'green', 'pink', 'yellow', 'violet'];
export const DEMO_PASSWORD = 'demo12345';

const daysAgo = (days) => new Date(Date.now() - days * 86_400_000);
const hoursAgo = (hours) => new Date(Date.now() - hours * 3_600_000);

async function clearDatabase() {
  await query('DELETE FROM reports');
  await query('DELETE FROM seller_reviews');
  await query('DELETE FROM book_ratings');
  await query('DELETE FROM favorites');
  await query('DELETE FROM messages');
  await query('DELETE FROM chats');
  await query('DELETE FROM listings');
  await query('DELETE FROM users');
}

export async function seedDatabase({ force = false } = {}) {
  const existing = await userRepository.countAll();
  if (existing > 0 && !force) return { seeded: false, reason: 'database is not empty', users: existing };

  if (force) await clearDatabase();

  const passwordHash = hashPassword(DEMO_PASSWORD);
  const users = [];

  for (const [index, demoUser] of demoUsers.entries()) {
    const result = await query(
      `INSERT INTO users (id, email, password_hash, name, city, role, rating, deals, bio, created_at)
       VALUES ($1, $2, $3, $4, $5, 'user', 0, $6, $7, $8)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING *`,
      [
        randomUUID(),
        demoUser.email,
        passwordHash,
        demoUser.name,
        demoUser.city,
        demoUser.deals,
        demoUser.bio,
        daysAgo(240 - index * 12)
      ]
    );
    users.push(result.rows[0]);
  }

  const listings = [];
  for (const [index, book] of demoBooks.entries()) {
    const seller = users[index % users.length];
    const result = await query(
      `INSERT INTO listings
         (seller_id, type, title, author, genre, publisher, year, condition, description,
          price, exchange_want, city, district, pickup, delivery, status, tone, images, views, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'active',$16,$17,$18,$19,$19)
       RETURNING *`,
      [
        seller.id,
        book.type,
        book.title,
        book.author,
        book.genre,
        book.publisher,
        book.year,
        book.condition,
        book.description,
        book.type === 'Продажа' ? book.price : null,
        book.type === 'Обмен' ? book.exchangeWant : null,
        book.city,
        ['Центр', 'Север', 'У метро', 'Парк Победы', 'Академгородок'][index % 5],
        index % 3 !== 2,
        index % 4 === 0,
        TONES[index % TONES.length],
        [],
        12 + ((index * 37) % 240),
        hoursAgo(index * 9 + 2)
      ]
    );
    listings.push(result.rows[0]);
  }

  // Book ratings: every rating comes from a different reader than the seller.
  for (const [index, listing] of listings.entries()) {
    const ratingCount = (index * 5) % 4;
    for (let step = 0; step < ratingCount; step += 1) {
      const rater = users[(index + step + 1) % users.length];
      if (rater.id === listing.seller_id) continue;
      const value = 4 + ((index + step) % 2);
      await query(
        `INSERT INTO book_ratings (user_id, listing_id, value, review, created_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, listing_id) DO NOTHING`,
        [rater.id, listing.id, value, step === 0 ? 'Книга в заявленном состоянии, приятно иметь дело.' : null, daysAgo(30 - step * 4)]
      );
    }
  }

  // Seller reviews drive users.rating through userRepository.recomputeRating.
  for (const [index, seller] of users.entries()) {
    const base = demoUsers[index].rating;
    const values = [Math.min(5, Math.round(base + 0.2)), Math.max(1, Math.round(base - 0.2)), Math.round(base)];
    for (const [step, value] of values.entries()) {
      const reviewer = users[(index + step + 1) % users.length];
      if (reviewer.id === seller.id) continue;
      await query(
        `INSERT INTO seller_reviews (author_id, seller_id, listing_id, rating, text, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          reviewer.id,
          seller.id,
          listings[(index + step) % listings.length].id,
          value,
          ['Всё пришло быстро, книга как на фото.', 'Договорились в тот же день, рекомендую.', 'Аккуратная упаковка и приятное общение.'][step % 3],
          daysAgo(20 - step * 3)
        ]
      );
    }
    await userRepository.recomputeRating(seller.id);
  }

  // A few favourites so the account area is not empty in the demo.
  for (const [userIndex, listingIndexes] of [[0, [3, 8, 12]], [1, [1, 5]]]) {
    for (const listingIndex of listingIndexes) {
      await query(
        `INSERT INTO favorites (user_id, listing_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [users[userIndex].id, listings[listingIndex].id]
      );
    }
  }

  const chatResult = await query(
    `INSERT INTO chats (listing_id, buyer_id, seller_id, created_at)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [listings[0].id, users[1].id, users[0].id, hoursAgo(20)]
  );
  const chat = chatResult.rows[0];
  for (const [messageIndex, message] of demoMessages.entries()) {
    await query(
      `INSERT INTO messages (chat_id, sender_id, text, read_at, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        chat.id,
        message.fromBuyer ? users[1].id : users[0].id,
        message.text,
        messageIndex < demoMessages.length - 1 ? hoursAgo(18 - messageIndex) : null,
        hoursAgo(19 - messageIndex)
      ]
    );
  }

  await query(
    `INSERT INTO reports (reporter_id, listing_id, reason, status, created_at)
     VALUES ($1, $2, $3, 'new', $4)`,
    [users[2].id, listings[6].id, 'Фото не соответствует описанию: на обложке заметные повреждения.', hoursAgo(26)]
  );
  await query(
    `INSERT INTO reports (reporter_id, listing_id, reason, status, created_at)
     VALUES ($1, $2, $3, 'reviewing', $4)`,
    [users[3].id, listings[10].id, 'Похоже на дубликат объявления от того же продавца.', hoursAgo(48)]
  );

  return {
    seeded: true,
    users: users.length,
    listings: listings.length,
    listingsFirstId: listings[0].id,
    accounts: demoUsers.slice(0, 3).map((user) => ({ email: user.email, password: DEMO_PASSWORD }))
  };
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  try {
    await runMigrations();
    const result = await seedDatabase({ force: process.argv.includes('--force') });
    if (result.seeded) {
      console.log(`Seeded ${result.users} users and ${result.listings} listings.`);
      console.log('Demo accounts (password demo12345):');
      for (const account of result.accounts) console.log(`  ${account.email}`);
    } else {
      console.log('Database already contains data, seeding skipped. Use --force to reset.');
    }
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}
