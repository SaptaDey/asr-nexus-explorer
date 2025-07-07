/**
 * Citation Management System for ASR-GoT
 * Vancouver style citation formatting and reference management
 */

export interface Citation {
  id: string;
  type: 'journal' | 'book' | 'conference' | 'website' | 'preprint';
  title: string;
  authors: string[];
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  year: number;
  doi?: string;
  url?: string;
  accessed_date?: string;
  publisher?: string;
  conference?: string;
  preprint_server?: string;
}

export class CitationManager {
  private citations: Map<string, Citation> = new Map();
  private citationOrder: string[] = [];

  addCitation(citation: Citation): string {
    const existingId = this.findExistingCitation(citation);
    
    if (existingId) {
      return existingId;
    }

    const id = citation.id || this.generateCitationId();
    citation.id = id;
    
    this.citations.set(id, citation);
    this.citationOrder.push(id);
    
    return id;
  }

  private findExistingCitation(newCitation: Citation): string | null {
    for (const [id, existing] of this.citations) {
      if (this.citationsMatch(existing, newCitation)) {
        return id;
      }
    }
    return null;
  }

  private citationsMatch(a: Citation, b: Citation): boolean {
    return (
      a.title.toLowerCase() === b.title.toLowerCase() &&
      a.year === b.year &&
      JSON.stringify(a.authors.sort()) === JSON.stringify(b.authors.sort())
    );
  }

  private generateCitationId(): string {
    return `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getCitation(id: string): Citation | undefined {
    return this.citations.get(id);
  }

  getAllCitations(): Citation[] {
    return this.citationOrder.map(id => this.citations.get(id)!);
  }

  formatCitationVancouver(citation: Citation): string {
    const authors = this.formatAuthorsVancouver(citation.authors);
    
    switch (citation.type) {
      case 'journal':
        return this.formatJournalCitation(citation, authors);
      
      case 'book':
        return this.formatBookCitation(citation, authors);
      
      case 'conference':
        return this.formatConferenceCitation(citation, authors);
      
      case 'website':
        return this.formatWebsiteCitation(citation, authors);
      
      case 'preprint':
        return this.formatPreprintCitation(citation, authors);
      
      default:
        return this.formatGenericCitation(citation, authors);
    }
  }

  private formatAuthorsVancouver(authors: string[]): string {
    if (authors.length === 0) return '';
    
    if (authors.length === 1) {
      return this.formatAuthorName(authors[0]);
    }
    
    if (authors.length <= 6) {
      const formattedAuthors = authors.map(author => this.formatAuthorName(author));
      return formattedAuthors.slice(0, -1).join(', ') + ', ' + formattedAuthors[formattedAuthors.length - 1];
    }
    
    // More than 6 authors - list first 6 then "et al."
    const firstSix = authors.slice(0, 6).map(author => this.formatAuthorName(author));
    return firstSix.join(', ') + ', et al.';
  }

  private formatAuthorName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    
    const lastName = parts[parts.length - 1];
    const initials = parts.slice(0, -1)
      .map(name => name.charAt(0).toUpperCase())
      .join('');
    
    return `${lastName} ${initials}`;
  }

  private formatJournalCitation(citation: Citation, authors: string): string {
    let formatted = `${authors}. ${citation.title}`;
    
    if (citation.journal) {
      formatted += `. ${citation.journal}`;
    }
    
    formatted += `. ${citation.year}`;
    
    if (citation.volume) {
      formatted += `;${citation.volume}`;
      
      if (citation.issue) {
        formatted += `(${citation.issue})`;
      }
    }
    
    if (citation.pages) {
      formatted += `:${citation.pages}`;
    }
    
    if (citation.doi) {
      formatted += `. doi:${citation.doi}`;
    }
    
    return formatted + '.';
  }

  private formatBookCitation(citation: Citation, authors: string): string {
    let formatted = `${authors}. ${citation.title}`;
    
    if (citation.publisher) {
      formatted += `. ${citation.publisher}`;
    }
    
    formatted += `; ${citation.year}`;
    
    if (citation.pages) {
      formatted += `. p. ${citation.pages}`;
    }
    
    return formatted + '.';
  }

  private formatConferenceCitation(citation: Citation, authors: string): string {
    let formatted = `${authors}. ${citation.title}`;
    
    if (citation.conference) {
      formatted += `. In: ${citation.conference}`;
    }
    
    formatted += `; ${citation.year}`;
    
    if (citation.pages) {
      formatted += `. p. ${citation.pages}`;
    }
    
    return formatted + '.';
  }

  private formatWebsiteCitation(citation: Citation, authors: string): string {
    let formatted = `${authors}. ${citation.title}`;
    
    if (citation.url) {
      formatted += ` [Internet]`;
    }
    
    formatted += `. ${citation.year}`;
    
    if (citation.url) {
      formatted += ` [cited ${citation.accessed_date || new Date().toISOString().split('T')[0]}]. Available from: ${citation.url}`;
    }
    
    return formatted + '.';
  }

  private formatPreprintCitation(citation: Citation, authors: string): string {
    let formatted = `${authors}. ${citation.title}`;
    
    if (citation.preprint_server) {
      formatted += `. ${citation.preprint_server}`;
    }
    
    formatted += `. ${citation.year}`;
    
    if (citation.doi) {
      formatted += `. doi:${citation.doi}`;
    } else if (citation.url) {
      formatted += `. Available from: ${citation.url}`;
    }
    
    return formatted + '.';
  }

  private formatGenericCitation(citation: Citation, authors: string): string {
    return `${authors}. ${citation.title}. ${citation.year}.`;
  }

  generateReferenceList(): string {
    const citations = this.getAllCitations();
    
    if (citations.length === 0) {
      return 'No references cited.';
    }
    
    let referenceList = '## References\n\n';
    
    citations.forEach((citation, index) => {
      const formatted = this.formatCitationVancouver(citation);
      referenceList += `${index + 1}. ${formatted}\n\n`;
    });
    
    return referenceList;
  }

  getInTextCitation(citationId: string): string {
    const citation = this.citations.get(citationId);
    if (!citation) return '[?]';
    
    const index = this.citationOrder.indexOf(citationId) + 1;
    return `[${index}]`;
  }

  // Extract citations from research text
  extractCitationsFromText(text: string): Citation[] {
    const extractedCitations: Citation[] = [];
    
    // Simple pattern matching for common citation formats
    const patterns = [
      // DOI pattern
      /doi:\s*10\.\d{4,}\/[^\s]+/gi,
      // URL pattern
      /https?:\/\/[^\s]+/gi,
      // Journal reference pattern
      /([A-Z][a-zA-Z\s,\.]+)\.\s*([A-Z][^\.]+)\.\s*([A-Z][a-zA-Z\s]+)\.\s*(\d{4})/g
    ];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // This is a simplified extraction - in practice, you'd use more sophisticated parsing
          const citation: Citation = {
            id: this.generateCitationId(),
            type: 'journal',
            title: match.substring(0, 100), // Truncate for safety
            authors: ['Unknown'],
            year: new Date().getFullYear()
          };
          
          extractedCitations.push(citation);
        });
      }
    });
    
    return extractedCitations;
  }

  // Export citations in various formats
  exportCitations(format: 'vancouver' | 'bibtex' | 'json' = 'vancouver'): string {
    const citations = this.getAllCitations();
    
    switch (format) {
      case 'bibtex':
        return this.exportBibTeX(citations);
      
      case 'json':
        return JSON.stringify(citations, null, 2);
      
      default:
        return this.generateReferenceList();
    }
  }

  private exportBibTeX(citations: Citation[]): string {
    let bibtex = '';
    
    citations.forEach((citation, index) => {
      const key = `ref${index + 1}`;
      bibtex += `@${citation.type}{${key},\n`;
      bibtex += `  title={${citation.title}},\n`;
      bibtex += `  author={${citation.authors.join(' and ')}},\n`;
      bibtex += `  year={${citation.year}},\n`;
      
      if (citation.journal) {
        bibtex += `  journal={${citation.journal}},\n`;
      }
      
      if (citation.volume) {
        bibtex += `  volume={${citation.volume}},\n`;
      }
      
      if (citation.pages) {
        bibtex += `  pages={${citation.pages}},\n`;
      }
      
      if (citation.doi) {
        bibtex += `  doi={${citation.doi}},\n`;
      }
      
      bibtex += '}\n\n';
    });
    
    return bibtex;
  }
}