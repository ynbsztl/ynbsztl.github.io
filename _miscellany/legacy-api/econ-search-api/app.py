#!/usr/bin/env python3
"""
Flask API for Econ Paper Search integration with Jekyll site
"""

import os
import sys
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from datetime import datetime
import re

# Add the Econ-Paper-Search Code directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'Econ-Paper-Search', 'Code'))

try:
    from data_processing import load_all_papers
    # Try to import semantic search, but make it optional
    try:
        # First try the original module
        from semantic_search import perform_semantic_search, load_semantic_model
        SEMANTIC_SEARCH_AVAILABLE = True
    except ImportError:
        try:
            # Fall back to standalone version
            from semantic_search_standalone import perform_semantic_search, load_semantic_model
            SEMANTIC_SEARCH_AVAILABLE = True
        except ImportError as e:
            print(f"Warning: Semantic search not available: {e}")
            SEMANTIC_SEARCH_AVAILABLE = False
            
            # Define dummy functions
            def perform_semantic_search(*args, **kwargs):
                return pd.DataFrame()
            
            def load_semantic_model():
                return None
            
except ImportError as e:
    print(f"Error importing modules: {e}")
    print("Please ensure the Econ-Paper-Search directory is properly set up")
    sys.exit(1)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global variables for caching
_papers_df = None
_embeddings = None
_last_update = None

def get_data_path():
    """Get the path to the data directory"""
    return os.path.join(os.path.dirname(__file__), '..', 'Econ-Paper-Search', 'Data')

def get_embeddings_path():
    """Get the path to the embeddings directory"""
    return os.path.join(os.path.dirname(__file__), '..', 'Econ-Paper-Search', 'Embeddings')

def load_papers_data():
    """Load papers data with caching"""
    global _papers_df, _last_update
    
    data_path = get_data_path()
    papers_file = os.path.join(data_path, 'papers_2020s.csv')
    
    if not os.path.exists(papers_file):
        raise FileNotFoundError(f"Papers data not found at {papers_file}")
    
    # Check if we need to reload data
    current_mtime = os.path.getmtime(papers_file)
    if _papers_df is None or _last_update != current_mtime:
        logger.info("Loading papers data...")
        _papers_df = load_all_papers(data_path)
        _last_update = current_mtime
        logger.info(f"Loaded {len(_papers_df)} papers")
    
    return _papers_df

def load_embeddings_data():
    """Load embeddings data with caching"""
    global _embeddings
    
    if _embeddings is not None:
        return _embeddings
    
    embeddings_path = get_embeddings_path()
    all_embeddings = []
    
    for period in ['b2000_part1', 'b2000_part2', '2000s', '2010s', '2015s', '2020s']:
        file_path = os.path.join(embeddings_path, f'embeddings_{period}.npy')
        if os.path.exists(file_path):
            embeddings = np.load(file_path).astype(np.float32)
            all_embeddings.append(embeddings)
            logger.info(f"Loaded embeddings for {period}: {embeddings.shape}")
    
    if all_embeddings:
        _embeddings = np.vstack(all_embeddings)
        logger.info(f"Total embeddings shape: {_embeddings.shape}")
        return _embeddings
    else:
        raise FileNotFoundError("No embedding files found")

def search_keywords(df, query, journals, year_begin, year_end, sort_method, max_show, search_author=False):
    """Perform keyword-based search"""
    # Filter by journal and year
    mask_journal = df.journal.isin(journals)
    mask_year = (df.year >= year_begin) & (df.year <= year_end)
    filtered_df = df.loc[mask_journal & mask_year].copy()
    
    if query.strip():
        # Create search text
        info = filtered_df.title + ' ' + filtered_df.abstract.fillna('')
        if search_author:
            info = info + ' ' + filtered_df.authors
        
        # Parse query
        if (' ' in query) and ("\"" not in query):
            keywords = query.split(' ')
        else:
            if "\"" in query:
                keywords = re.findall(r'(?:"[^"]*"|[^\s"])+', query)
                keywords = [k.replace("\"", "") for k in keywords]
            else:
                keywords = [query]
        
        # Handle OR operations
        keywords_or = [s for s in keywords if "|" in s]
        if keywords_or:
            mask_or = []
            for kws in keywords_or:
                kws_split = kws.split("|")
                masks_or = [info.str.contains(s, case=False, regex=False, na=False) for s in kws_split]
                mask_or.append(np.vstack(masks_or).any(axis=0))
            mask_or = np.vstack(mask_or).all(axis=0)
            keywords = [s for s in keywords if s not in keywords_or]
            if not keywords:
                keywords = [""]
        else:
            mask_or = [True] * len(filtered_df)
        
        # Apply keyword filters
        if keywords and keywords[0]:
            masks = [info.str.contains(s, case=False, regex=False, na=False) for s in keywords]
            mask = np.vstack([np.vstack(masks), mask_or]).all(axis=0)
            filtered_df = filtered_df.loc[mask]
    
    # Sort results
    if sort_method == 'recent':
        filtered_df = filtered_df.sort_values('year', ascending=False)
    elif sort_method == 'early':
        filtered_df = filtered_df.sort_values('year', ascending=True)
    
    # Limit results
    filtered_df = filtered_df.head(max_show)
    
    return filtered_df.reset_index(drop=True)

def search_semantic(df, query, journals, year_begin, year_end, sort_method, min_similarity, max_show):
    """Perform semantic search"""
    if not query.strip():
        return pd.DataFrame()
    
    # Filter by journal and year
    mask_journal = df.journal.isin(journals)
    mask_year = (df.year >= year_begin) & (df.year <= year_end)
    mask = mask_journal & mask_year
    
    filtered_df = df[mask].copy()
    
    if len(filtered_df) == 0:
        return pd.DataFrame()
    
    # Load embeddings
    embeddings = load_embeddings_data()
    
    if len(embeddings) != len(df):
        raise ValueError(f"Embeddings length ({len(embeddings)}) doesn't match papers length ({len(df)})")
    
    # Filter embeddings
    filtered_embeddings = embeddings[mask]
    
    # Perform semantic search
    results = perform_semantic_search(query, filtered_df, filtered_embeddings, min_similarity)
    
    if len(results) == 0:
        return pd.DataFrame()
    
    # Sort results
    if sort_method == 'recent':
        results = results.sort_values(['year', 'similarity'], ascending=[False, False])
    elif sort_method == 'early':
        results = results.sort_values(['year', 'similarity'], ascending=[True, False])
    else:  # similarity
        results = results.sort_values('similarity', ascending=False)
    
    # Limit results
    results = results.head(max_show)
    
    return results.reset_index(drop=True)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/search', methods=['POST'])
def search():
    """Main search endpoint"""
    try:
        data = request.get_json()
        
        # Extract parameters
        query = data.get('query', '').strip()
        mode = data.get('mode', 'keyword')
        journals = data.get('journals', [])
        year_from = int(data.get('yearFrom', 1980))
        year_to = int(data.get('yearTo', datetime.now().year))
        sort_by = data.get('sortBy', 'recent')
        max_results = int(data.get('maxResults', 50))
        min_similarity = float(data.get('minSimilarity', 0.5))
        search_author = data.get('searchAuthor', False)
        
        # Validate parameters
        if not journals:
            return jsonify({'error': 'At least one journal must be selected'}), 400
        
        if year_from > year_to:
            return jsonify({'error': 'Start year cannot be greater than end year'}), 400
        
        # Load data
        df = load_papers_data()
        
        # Perform search based on mode
        if mode == 'ai':
            if not query:
                return jsonify({'error': 'Query is required for AI search'}), 400
            results_df = search_semantic(df, query, journals, year_from, year_to, sort_by, min_similarity, max_results)
        else:  # keyword
            results_df = search_keywords(df, query, journals, year_from, year_to, sort_by, max_results, search_author)
        
        # Convert results to JSON format
        results = []
        for _, row in results_df.iterrows():
            result = {
                'title': row.title,
                'authors': row.authors,
                'year': int(row.year),
                'journal': row.journal,
                'url': row.url if pd.notna(row.url) else None,
                'abstract': row.abstract if pd.notna(row.abstract) else None
            }
            
            # Add similarity score for AI search
            if mode == 'ai' and 'similarity' in row:
                result['similarity'] = float(row.similarity)
            
            results.append(result)
        
        return jsonify({
            'results': results,
            'total': len(results),
            'mode': mode,
            'query': query
        })
        
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        return jsonify({'error': f'Search failed: {str(e)}'}), 500

@app.route('/journals', methods=['GET'])
def get_journals():
    """Get available journals"""
    journals = {
        'categories': {
            'top5': ['aer', 'jpe', 'qje', 'ecta', 'restud'],
            'general': ['aer', 'jpe', 'qje', 'ecta', 'restud', 'aeri', 'restat', 'jeea', 'eer', 'ej', 'qe'],
            'survey': ['jep', 'jel', 'are']
        },
        'all': ['aer', 'jpe', 'qje', 'ecta', 'restud', 'aejmac', 'aejmic', 'aejapp', 'aejpol', 'aeri', 'jpemic', 'jpemac', 'restat', 'jeea', 'eer', 'ej', 'jep', 'jel', 'are', 'qe', 'jeg', 'jet', 'te', 'joe', 'jme', 'red', 'rand', 'jole', 'jhr', 'jie', 'ier', 'jpube', 'jde', 'jeh', 'jue', 'jhe'],
        'names': {
            'aer': 'American Economic Review',
            'jpe': 'Journal of Political Economy',
            'qje': 'Quarterly Journal of Economics',
            'ecta': 'Econometrica',
            'restud': 'Review of Economic Studies',
            'aejmac': 'AEJ Macroeconomics',
            'aejmic': 'AEJ Microeconomics',
            'aejapp': 'AEJ Applied Economics',
            'aejpol': 'AEJ Economic Policy',
            'aeri': 'AER Insights',
            'jpemic': 'JPE Microeconomics',
            'jpemac': 'JPE Macroeconomics',
            'restat': 'Review of Economics and Statistics',
            'jeea': 'Journal of the European Economic Association',
            'eer': 'European Economic Review',
            'ej': 'Economic Journal',
            'jep': 'Journal of Economic Perspectives',
            'jel': 'Journal of Economic Literature',
            'are': 'Annual Review of Economics',
            'qe': 'Quantitative Economics',
            'jeg': 'Journal of Economic Growth',
            'jet': 'Journal of Economic Theory',
            'te': 'Theoretical Economics',
            'joe': 'Journal of Econometrics',
            'jme': 'Journal of Monetary Economics',
            'red': 'Review of Economic Dynamics',
            'rand': 'RAND Journal of Economics',
            'jole': 'Journal of Labor Economics',
            'jhr': 'Journal of Human Resources',
            'jie': 'Journal of International Economics',
            'ier': 'International Economic Review',
            'jpube': 'Journal of Public Economics',
            'jde': 'Journal of Development Economics',
            'jeh': 'Journal of Economic History',
            'jue': 'Journal of Urban Economics',
            'jhe': 'Journal of Health Economics'
        }
    }
    return jsonify(journals)

@app.route('/stats', methods=['GET'])
def get_stats():
    """Get database statistics"""
    try:
        df = load_papers_data()
        
        stats = {
            'total_papers': len(df),
            'year_range': {
                'min': int(df.year.min()),
                'max': int(df.year.max())
            },
            'journals': df.journal.value_counts().to_dict(),
            'papers_by_year': df.groupby('year').size().to_dict(),
            'last_updated': datetime.fromtimestamp(_last_update).isoformat() if _last_update else None
        }
        
        return jsonify(stats)
        
    except Exception as e:
        logger.error(f"Stats error: {str(e)}")
        return jsonify({'error': f'Failed to get stats: {str(e)}'}), 500

if __name__ == '__main__':
    # Check if data files exist
    data_path = get_data_path()
    if not os.path.exists(data_path):
        print(f"Error: Data directory not found at {data_path}")
        print("Please ensure the Econ-Paper-Search directory is properly set up")
        sys.exit(1)
    
    # Pre-load data to check for issues
    try:
        logger.info("Pre-loading data...")
        load_papers_data()
        logger.info("Data loaded successfully")
        
        # Try to load embeddings (optional for keyword search)
        try:
            load_embeddings_data()
            logger.info("Embeddings loaded successfully")
        except Exception as e:
            logger.warning(f"Embeddings not available: {e}")
            logger.warning("AI search will not be available")
        
    except Exception as e:
        logger.error(f"Failed to load data: {e}")
        sys.exit(1)
    
    # Start the Flask app
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting Flask app on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
