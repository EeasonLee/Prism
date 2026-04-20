import { describe, expect, it } from 'vitest';

describe('review upload response parsing', async () => {
  const { extractUploadItemsForTest } = await import(
    '../app/api/reviews/upload/route'
  );

  it('accepts project upload responses wrapped in an items object', () => {
    const items = extractUploadItemsForTest({
      items: [
        {
          id: 1,
          url: '/uploads/example.jpg',
          mime: 'image/jpeg',
        },
      ],
    });

    expect(items).toEqual([
      {
        id: 1,
        url: '/uploads/example.jpg',
        mime: 'image/jpeg',
      },
    ]);
  });
});
