import { describe, it, expect } from 'vitest';

// Research utility functions to test
const generateCitation = (author: string, title: string, year: number, journal?: string): string => {
  const basecitation = `${author}. ${title}. ${year}`;
  return journal ? `${basecitation}. ${journal}.` : `${basecitation}.`;
};

const extractKeywords = (text: string, minLength: number = 3): string[] => {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter(word => word.length >= minLength && !isStopWord(word))
    .filter((word, index, arr) => arr.indexOf(word) === index) // unique
    .sort();
};

const isStopWord = (word: string): boolean => {
  const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall'];
  return stopWords.includes(word.toLowerCase());
};

const calculateReadingTime = (text: string, wordsPerMinute: number = 200): number => {
  if (!text.trim()) return 0;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
};

const extractDOI = (text: string): string[] => {
  const doiPattern = /10\.\d{4,}\/[^\s]+/g;
  return text.match(doiPattern) || [];
};

const formatAuthorName = (firstName: string, lastName: string, format: 'apa' | 'mla' = 'apa'): string => {
  if (format === 'apa') {
    return `${lastName}, ${firstName.charAt(0)}.`;
  } else {
    return `${lastName}, ${firstName}`;
  }
};

const generateAbstract = (text: string, maxWords: number = 150): string => {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  
  let abstract = words.slice(0, maxWords).join(' ');
  // Try to end at a sentence
  const lastPeriod = abstract.lastIndexOf('.');
  if (lastPeriod > abstract.length * 0.8) {
    abstract = abstract.substring(0, lastPeriod + 1);
  } else {
    abstract += '...';
  }
  return abstract;
};

const validateResearchField = (field: string): boolean => {
  const validFields = [
    'biology', 'chemistry', 'physics', 'mathematics', 'computer science',
    'psychology', 'sociology', 'anthropology', 'economics', 'political science',
    'medicine', 'engineering', 'environmental science', 'neuroscience',
    'genetics', 'biochemistry', 'astronomy', 'geology', 'archaeology'
  ];
  return validFields.includes(field.toLowerCase());
};

const categorizeResearch = (abstract: string): string[] => {
  const categories: { [key: string]: string[] } = {
    'experimental': ['experiment', 'trial', 'test', 'laboratory', 'controlled'],
    'theoretical': ['theory', 'model', 'hypothesis', 'framework', 'conceptual'],
    'empirical': ['data', 'survey', 'observation', 'measurement', 'statistics'],
    'review': ['review', 'meta-analysis', 'systematic', 'literature', 'synthesis'],
    'computational': ['simulation', 'algorithm', 'computational', 'modeling', 'software']
  };

  const lowerAbstract = abstract.toLowerCase();
  const matchedCategories: string[] = [];

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerAbstract.includes(keyword))) {
      matchedCategories.push(category);
    }
  }

  return matchedCategories.length > 0 ? matchedCategories : ['general'];
};

const calculateCitationScore = (citations: number, years: number): number => {
  if (years <= 0) return citations;
  return Math.round((citations / years) * 100) / 100;
};

const generateResearchId = (title: string, year: number): string => {
  const cleanTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(' ')
    .filter(word => word.length > 2 && !isStopWord(word))
    .slice(0, 3)
    .join('-');
  return `${cleanTitle}-${year}`;
};

const validateORCID = (orcid: string): boolean => {
  const orcidPattern = /^0000-000(1-[5-9]|2-[0-9]|3-[0-4])\d{3}-\d{3}[\dX]$/;
  return orcidPattern.test(orcid);
};

describe('Research Utility Functions', () => {
  describe('generateCitation', () => {
    it('should generate basic citations', () => {
      expect(generateCitation('Smith, J.', 'Research Methods', 2023))
        .toBe('Smith, J.. Research Methods. 2023.');
    });

    it('should include journal when provided', () => {
      expect(generateCitation('Doe, A.', 'Data Analysis', 2022, 'Nature'))
        .toBe('Doe, A.. Data Analysis. 2022. Nature.');
    });

    it('should handle different author formats', () => {
      expect(generateCitation('Brown', 'Study Title', 2021))
        .toBe('Brown. Study Title. 2021.');
    });
  });

  describe('extractKeywords', () => {
    it('should extract unique keywords', () => {
      const text = 'The research methodology used statistical analysis and data mining techniques';
      const keywords = extractKeywords(text);
      
      expect(keywords).toContain('research');
      expect(keywords).toContain('methodology');
      expect(keywords).toContain('statistical');
      expect(keywords).not.toContain('the');
      expect(keywords).not.toContain('and');
    });

    it('should respect minimum length', () => {
      const keywords = extractKeywords('A big cat ran to us', 4);
      expect(keywords).not.toContain('big');
      expect(keywords).not.toContain('cat');
      expect(keywords).not.toContain('ran');
    });

    it('should handle empty text', () => {
      expect(extractKeywords('')).toEqual([]);
    });
  });

  describe('calculateReadingTime', () => {
    it('should calculate reading time correctly', () => {
      const text = 'word '.repeat(200); // 200 words
      expect(calculateReadingTime(text)).toBe(1);
      
      const longText = 'word '.repeat(500); // 500 words
      expect(calculateReadingTime(longText)).toBe(3);
    });

    it('should handle custom words per minute', () => {
      const text = 'word '.repeat(100);
      expect(calculateReadingTime(text, 100)).toBe(1);
      expect(calculateReadingTime(text, 50)).toBe(2);
    });

    it('should handle empty text', () => {
      expect(calculateReadingTime('')).toBe(0);
    });
  });

  describe('extractDOI', () => {
    it('should extract DOI from text', () => {
      const text = 'See https://doi.org/10.1038/nature12373 for details';
      const dois = extractDOI(text);
      expect(dois).toContain('10.1038/nature12373');
    });

    it('should extract multiple DOIs', () => {
      const text = 'References: 10.1000/123456 and 10.5555/abcdef';
      const dois = extractDOI(text);
      expect(dois).toHaveLength(2);
    });

    it('should return empty array when no DOI found', () => {
      expect(extractDOI('No DOI here')).toEqual([]);
    });
  });

  describe('formatAuthorName', () => {
    it('should format in APA style by default', () => {
      expect(formatAuthorName('John', 'Smith')).toBe('Smith, J.');
      expect(formatAuthorName('Mary Jane', 'Doe')).toBe('Doe, M.');
    });

    it('should format in MLA style when specified', () => {
      expect(formatAuthorName('John', 'Smith', 'mla')).toBe('Smith, John');
    });
  });

  describe('generateAbstract', () => {
    it('should truncate long text', () => {
      const longText = 'word '.repeat(200);
      const abstract = generateAbstract(longText, 50);
      const wordCount = abstract.split(/\s+/).length;
      expect(wordCount).toBeLessThanOrEqual(52); // 50 + potential ellipsis
    });

    it('should preserve short text', () => {
      const shortText = 'This is a short abstract.';
      expect(generateAbstract(shortText, 100)).toBe(shortText);
    });

    it('should try to end at sentence boundary', () => {
      const text = 'First sentence. Second sentence. Third sentence continues here.';
      const abstract = generateAbstract(text, 4);
      expect(abstract).toMatch(/\.$/);
    });
  });

  describe('validateResearchField', () => {
    it('should validate known research fields', () => {
      expect(validateResearchField('Biology')).toBe(true);
      expect(validateResearchField('computer science')).toBe(true);
      expect(validateResearchField('PSYCHOLOGY')).toBe(true);
    });

    it('should reject unknown fields', () => {
      expect(validateResearchField('astrology')).toBe(false);
      expect(validateResearchField('cooking')).toBe(false);
    });
  });

  describe('categorizeResearch', () => {
    it('should categorize experimental research', () => {
      const abstract = 'We conducted a controlled experiment in the laboratory';
      const categories = categorizeResearch(abstract);
      expect(categories).toContain('experimental');
    });

    it('should categorize theoretical research', () => {
      const abstract = 'This paper presents a theoretical framework and model';
      const categories = categorizeResearch(abstract);
      expect(categories).toContain('theoretical');
    });

    it('should return multiple categories', () => {
      const abstract = 'Our experimental study used computational modeling and data analysis';
      const categories = categorizeResearch(abstract);
      expect(categories.length).toBeGreaterThan(1);
    });

    it('should return general for unmatched content', () => {
      const abstract = 'Some random text without research keywords';
      const categories = categorizeResearch(abstract);
      expect(categories).toEqual(['general']);
    });
  });

  describe('calculateCitationScore', () => {
    it('should calculate citations per year', () => {
      expect(calculateCitationScore(100, 5)).toBe(20);
      expect(calculateCitationScore(75, 3)).toBe(25);
    });

    it('should handle edge cases', () => {
      expect(calculateCitationScore(50, 0)).toBe(50);
      expect(calculateCitationScore(0, 5)).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      expect(calculateCitationScore(10, 3)).toBe(3.33);
    });
  });

  describe('generateResearchId', () => {
    it('should generate clean research IDs', () => {
      expect(generateResearchId('The Impact of Climate Change', 2023))
        .toBe('impact-climate-change-2023');
    });

    it('should handle special characters', () => {
      expect(generateResearchId('AI & Machine Learning: A Study!', 2022))
        .toBe('machine-learning-study-2022');
    });

    it('should limit to 3 words', () => {
      const longTitle = 'A Very Long Research Title With Many Important Words';
      const id = generateResearchId(longTitle, 2021);
      const wordCount = id.split('-').length - 1; // -1 for year
      expect(wordCount).toBe(3);
    });
  });

  describe('validateORCID', () => {
    it('should validate correct ORCID format', () => {
      expect(validateORCID('0000-0002-1825-0097')).toBe(true);
      expect(validateORCID('0000-0003-1234-567X')).toBe(true);
    });

    it('should reject invalid ORCID format', () => {
      expect(validateORCID('0000-0001-1234-5678')).toBe(false); // Invalid range
      expect(validateORCID('1234-5678-9012-3456')).toBe(false); // Wrong prefix
      expect(validateORCID('0000-002-1825-0097')).toBe(false);  // Wrong format
    });
  });

  describe('Integration Tests', () => {
    it('should process a complete research paper', () => {
      const paperData = {
        title: 'Machine Learning Applications in Climate Research',
        authors: [
          { first: 'Jane', last: 'Doe' },
          { first: 'John', last: 'Smith' }
        ],
        abstract: 'This experimental study uses computational modeling to analyze climate data and presents theoretical frameworks for understanding environmental changes.',
        year: 2023,
        journal: 'Nature Climate Change'
      };

      // Test multiple utilities together
      const researchId = generateResearchId(paperData.title, paperData.year);
      const categories = categorizeResearch(paperData.abstract);
      const keywords = extractKeywords(paperData.abstract);
      const citation = generateCitation(
        formatAuthorName(paperData.authors[0].first, paperData.authors[0].last),
        paperData.title,
        paperData.year,
        paperData.journal
      );

      expect(researchId).toBe('machine-learning-applications-2023');
      expect(categories).toEqual(expect.arrayContaining(['experimental', 'computational', 'theoretical']));
      expect(keywords).toContain('climate');
      expect(citation).toContain('Doe, J.');
    });

    it('should handle research metrics calculation', () => {
      const paper = {
        citations: 150,
        publicationYear: 2020,
        currentYear: 2023
      };

      const yearsPublished = paper.currentYear - paper.publicationYear;
      const citationScore = calculateCitationScore(paper.citations, yearsPublished);
      
      expect(citationScore).toBe(50); // 150 citations / 3 years = 50
    });

    it('should validate complete researcher profile', () => {
      const researcher = {
        orcid: '0000-0002-1825-0097',
        field: 'Computer Science',
        papers: [
          { title: 'AI Research', year: 2023, citations: 25 },
          { title: 'Data Mining', year: 2022, citations: 40 }
        ]
      };

      expect(validateORCID(researcher.orcid)).toBe(true);
      expect(validateResearchField(researcher.field)).toBe(true);
      
      const totalCitations = researcher.papers.reduce((sum, paper) => sum + paper.citations, 0);
      expect(totalCitations).toBe(65);
    });
  });
});