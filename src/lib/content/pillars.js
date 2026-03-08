// src/lib/content/pillars.js
// Content Pillars System
// Replaces hook types with strategic content pillars
// Auto-generates 5 pillars × 10 angles = 50 content angles per campaign

// ===========================================
// PILLAR DEFINITIONS BY BUSINESS TYPE
// ===========================================

export const PILLAR_TEMPLATES = {
  'tiktok-shop': {
    name: 'TikTok Shop',
    pillars: [
      {
        id: 'myths',
        name: 'Myth Busting',
        description: 'Debunk common misconceptions in your category',
        anglePrompts: [
          'The biggest lie about [category]',
          'Why [common belief] is actually wrong',
          '[Number] myths that are costing you money',
          'What [experts] won\'t tell you about [category]',
          'The truth about [controversial topic]',
          'Stop believing this about [category]',
          'I fell for this [category] myth for years',
          'The [category] industry doesn\'t want you to know this',
          'Why everything you know about [category] is wrong',
          'The real reason [common problem] happens',
        ],
      },
      {
        id: 'mistakes',
        name: 'Beginner Mistakes',
        description: 'Common errors your audience makes',
        anglePrompts: [
          '[Number] mistakes I made when starting [activity]',
          'The #1 reason people fail at [goal]',
          'What I wish I knew before [activity]',
          'Stop doing this if you want [result]',
          'The mistake that cost me [specific loss]',
          'Why [common approach] doesn\'t work',
          'I wasted [time/money] on this mistake',
          'The beginner trap everyone falls into',
          'What nobody tells you about [activity]',
          'How I almost gave up because of this',
        ],
      },
      {
        id: 'transformation',
        name: 'Transformation Stories',
        description: 'Before/after emotional journeys',
        anglePrompts: [
          'How I went from [before] to [after] in [time]',
          'The moment everything changed for me',
          '[Timeframe] ago I couldn\'t [struggle]. Now...',
          'My [category] transformation story',
          'What [number] weeks of [product/method] did',
          'The turning point nobody talks about',
          'From [negative state] to [positive state]',
          'I never thought I\'d be able to [achievement]',
          'The journey from [start] to [result]',
          'Why I almost didn\'t try this',
        ],
      },
      {
        id: 'comparison',
        name: 'Product Comparisons',
        description: 'Why this solution beats alternatives',
        anglePrompts: [
          'Why I switched from [alternative] to this',
          '[Product] vs [competitor] - honest review',
          'I tried [number] options. Here\'s the winner.',
          'What [expensive option] does that this doesn\'t',
          'The difference between [cheap] and [quality]',
          'Why [popular option] didn\'t work for me',
          'Comparing [method A] vs [method B]',
          'Is [product type] worth it? My honest take',
          'What I use instead of [common solution]',
          'The best [category] for [specific need]',
        ],
      },
      {
        id: 'behind-scenes',
        name: 'Behind the Scenes',
        description: 'Authentic daily life content',
        anglePrompts: [
          'A day in my life with [product]',
          'My morning routine using [product]',
          'How I actually use this every day',
          'What my [routine] looks like now',
          'The unsexy truth about [activity]',
          'Real talk about [category]',
          'What [time period] of using this looks like',
          'My honest experience after [timeframe]',
          'The parts of [activity] nobody shows',
          'Day [number] of [challenge/journey]',
        ],
      },
    ],
  },
  
  'ecommerce': {
    name: 'E-commerce / DTC',
    pillars: [
      {
        id: 'problem-aware',
        name: 'Problem Awareness',
        description: 'Surface pains your audience doesn\'t realize they have',
        anglePrompts: [
          'Signs you\'re dealing with [problem] and don\'t know it',
          'Why you wake up feeling [negative state]',
          'The hidden cause of [common symptom]',
          'What [symptom] is actually telling you',
          '[Number] warning signs you\'re ignoring',
          'If you experience [symptom], watch this',
          'The real reason you can\'t [desired action]',
          'Why [common solution] isn\'t working for you',
          'What your [body/business/life] is trying to tell you',
          'The connection between [A] and [B] nobody talks about',
        ],
      },
      {
        id: 'social-proof',
        name: 'Social Proof',
        description: 'Others\' experiences and reactions',
        anglePrompts: [
          '[Number] people asked me about this today',
          'My [relationship] keeps asking what I\'m using',
          'POV: Your friend finally tells you their secret',
          'Why everyone at [place] noticed the difference',
          'The question I get asked every day now',
          'My [person] tried this after seeing my results',
          'What happened when I shared this with my [group]',
          'The reaction I got when I showed up [result]',
          'Why my [person] is now obsessed with this',
          'What [number] weeks did that people noticed',
        ],
      },
      {
        id: 'objection-handling',
        name: 'Objection Handling',
        description: 'Address reasons people don\'t buy',
        anglePrompts: [
          'I know what you\'re thinking about [product]',
          'Yes, I was skeptical too. Here\'s what happened.',
          'The reason I almost didn\'t try this',
          'Why I thought [product category] was a scam',
          'Addressing the [price/time/effort] concern',
          'What I\'d tell my skeptical self',
          'The objection that almost stopped me',
          'Why [common fear] shouldn\'t hold you back',
          'I get it. [Objection]. But...',
          'The truth about [common concern]',
        ],
      },
      {
        id: 'use-cases',
        name: 'Use Cases',
        description: 'Different ways to use the product',
        anglePrompts: [
          '[Number] ways I use this that nobody talks about',
          'The unexpected benefit I discovered',
          'How to use [product] for [alternative purpose]',
          'What happens when you use this for [timeframe]',
          'The hack that changed everything for me',
          'How I incorporate this into my [routine]',
          'Using [product] for [unexpected situation]',
          'The way I use this is probably wrong but...',
          'My favorite way to use this that nobody does',
          'The secret use case that sold me',
        ],
      },
      {
        id: 'results-proof',
        name: 'Results & Proof',
        description: 'Specific measurable outcomes',
        anglePrompts: [
          '[Specific number] in [timeframe]. Here\'s how.',
          'The exact results after [timeframe]',
          'What [product] actually did for my [metric]',
          'Measuring the difference after [timeframe]',
          'Real numbers, no filter',
          'The data doesn\'t lie',
          'Before vs after - let the results speak',
          'What [number] [units] of [product] did',
          'I tracked everything for [timeframe]. Results:',
          'The improvement I didn\'t expect',
        ],
      },
    ],
  },
  
  'saas': {
    name: 'SaaS / Software',
    pillars: [
      {
        id: 'time-savings',
        name: 'Time Savings',
        description: 'How much time the tool saves',
        anglePrompts: [
          'I used to spend [hours] on this. Now it takes [minutes].',
          'What I do with the [number] hours I got back',
          'The task that used to ruin my day',
          'How I automated [painful process]',
          'From [time] to [time]: the difference',
          'The workflow that changed my productivity',
          'Why I stopped doing [manual task]',
          'What happens when you automate [process]',
          'The [number] minutes that used to take [hours]',
          'How I 10x\'d my output without working more',
        ],
      },
      {
        id: 'frustration',
        name: 'Frustration Relief',
        description: 'Pain points the tool solves',
        anglePrompts: [
          'If [frustrating scenario], this is for you',
          'The thing that made me want to quit [role]',
          'Why [common tool] was killing my productivity',
          'The breaking point that made me switch',
          'What I was doing before (don\'t judge)',
          'The workaround I was using that was insane',
          'Why [manual process] isn\'t sustainable',
          'The moment I realized I needed help',
          'What [role]s deal with that nobody talks about',
          'The daily frustration I finally solved',
        ],
      },
      {
        id: 'features',
        name: 'Feature Highlights',
        description: 'Specific capabilities that matter',
        anglePrompts: [
          'The feature that sold me immediately',
          'What [feature] actually does for my workflow',
          'The thing nobody talks about with [product]',
          'How [feature] works in real life',
          'The capability I didn\'t know I needed',
          'What happens when you use [feature]',
          'The difference [feature] makes day to day',
          'Why [feature] matters more than [competitor feature]',
          'The hidden feature that changes everything',
          'How I use [feature] differently than intended',
        ],
      },
      {
        id: 'roi',
        name: 'ROI & Value',
        description: 'Business case and outcomes',
        anglePrompts: [
          'What [product] costs vs what it saves',
          'The ROI math on [product]',
          'How [product] paid for itself in [timeframe]',
          'What I was paying before vs now',
          'The true cost of not having [product]',
          'Why [price] is actually cheap for this',
          'The value equation nobody calculates',
          'What [number] per month actually gets you',
          'How I justified the cost to myself',
          'The return I wasn\'t expecting',
        ],
      },
      {
        id: 'workflow',
        name: 'Workflow Integration',
        description: 'How it fits into daily work',
        anglePrompts: [
          'How [product] fits into my daily workflow',
          'My setup for [product] that works perfectly',
          'What my [process] looks like with [product]',
          'The integration that made everything click',
          'How I combined [product] with [other tool]',
          'My morning workflow with [product]',
          'What [product] looks like in practice',
          'The setup I wish I\'d done from day one',
          'How [product] connects with everything else',
          'My [product] workflow after [timeframe]',
        ],
      },
    ],
  },
  
  'service': {
    name: 'Service Business',
    pillars: [
      {
        id: 'expertise',
        name: 'Expertise Showcase',
        description: 'Demonstrate knowledge and credibility',
        anglePrompts: [
          'What [years] in [industry] taught me',
          'The advice I give every client',
          'Why [common approach] doesn\'t work',
          '[Number] things I learned the hard way',
          'What separates good [service] from great',
          'The question I get asked most often',
          'What most [practitioners] get wrong',
          'The insight that changed how I work',
          'Why I do [thing] differently than others',
          'The principle that guides everything I do',
        ],
      },
      {
        id: 'client-results',
        name: 'Client Results',
        description: 'Success stories and outcomes',
        anglePrompts: [
          'What happened when my client tried [approach]',
          'The result that surprised even me',
          'How [client type] went from [before] to [after]',
          'Why [client] came to me and what we did',
          'The transformation that took [timeframe]',
          'What [number] of clients have achieved',
          'The success story I\'m most proud of',
          'How we solved [specific problem] together',
          'The outcome nobody believed was possible',
          'What consistency for [timeframe] produced',
        ],
      },
      {
        id: 'process',
        name: 'Process Revelation',
        description: 'Show how you work',
        anglePrompts: [
          'What working with me actually looks like',
          'The first thing I do with every client',
          'My process for [service] explained',
          'Why my approach is different',
          'What happens in the first [timeframe]',
          'The step nobody else includes',
          'How I customize [service] for each client',
          'My framework for [result]',
          'The methodology behind my results',
          'What a typical [engagement] includes',
        ],
      },
      {
        id: 'education',
        name: 'Educational Content',
        description: 'Teach something valuable',
        anglePrompts: [
          'How to [achieve result] without [sacrifice]',
          '[Number] steps to [desired outcome]',
          'The guide I wish existed when I started',
          'What you need to know about [topic]',
          'The basics of [topic] explained simply',
          'How [thing] actually works',
          'The mistake costing you [outcome]',
          'Why [common belief] is backwards',
          'The simple trick for [result]',
          'What [experts] do that [amateurs] don\'t',
        ],
      },
      {
        id: 'personality',
        name: 'Personality & Values',
        description: 'Build personal connection',
        anglePrompts: [
          'Why I became a [profession]',
          'The moment I knew this was my calling',
          'What drives me to do this work',
          'The client I\'ll never forget',
          'Why I turn down certain clients',
          'The value I care about most',
          'What [profession] means to me',
          'The lesson that shaped who I am',
          'Why I do things differently',
          'The story behind my approach',
        ],
      },
    ],
  },
  
  'content-creator': {
    name: 'Content Creator / UGC Agency',
    pillars: [
      {
        id: 'behind-content',
        name: 'Behind the Content',
        description: 'Show the creation process',
        anglePrompts: [
          'How I actually make my content',
          'The setup nobody sees',
          'What [number] hours of filming looks like',
          'My content creation workflow',
          'The tools I use every day',
          'How long this really takes',
          'The editing process revealed',
          'What my workspace looks like',
          'The routine behind my content',
          'How I batch create for the week',
        ],
      },
      {
        id: 'growth-tips',
        name: 'Growth & Strategy',
        description: 'Share what works',
        anglePrompts: [
          'How I grew to [number] in [timeframe]',
          'The strategy that actually works',
          'What I\'d do differently starting over',
          'The algorithm insight nobody shares',
          'Why [metric] matters more than [metric]',
          'The posting schedule that works for me',
          'How I find content ideas',
          'The analytics that actually matter',
          'What [number] posts taught me',
          'The growth hack I discovered by accident',
        ],
      },
      {
        id: 'trends',
        name: 'Trend Analysis',
        description: 'Commentary on what\'s working',
        anglePrompts: [
          'Why this trend is blowing up',
          'The format that\'s working right now',
          'What\'s changing in [year]',
          'The trend I\'m seeing everywhere',
          'Why this style is taking over',
          'What [successful creators] are doing',
          'The shift happening in content',
          'Why [old approach] doesn\'t work anymore',
          'The new thing I\'m testing',
          'What\'s working that nobody talks about',
        ],
      },
      {
        id: 'mistakes-learned',
        name: 'Lessons & Mistakes',
        description: 'Honest failures and learnings',
        anglePrompts: [
          'The post that flopped and why',
          'What [number] months of [failure] taught me',
          'The mistake that almost made me quit',
          'Why I stopped doing [thing]',
          'The hardest lesson I learned',
          'What nobody told me about content',
          'The belief that was holding me back',
          'Why I was doing it all wrong',
          'The pivot that changed everything',
          'What failing taught me about [topic]',
        ],
      },
      {
        id: 'motivation',
        name: 'Motivation & Mindset',
        description: 'Connect on personal level',
        anglePrompts: [
          'Why I keep creating even when [struggle]',
          'The moment I almost gave up',
          'What keeps me going on hard days',
          'The mindset shift that changed everything',
          'Why consistency beats perfection',
          'The reason I started this journey',
          'What [number] of posts taught me about myself',
          'The fear I had to overcome',
          'Why I post even when nobody watches',
          'The truth about the creator journey',
        ],
      },
    ],
  },
};

// ===========================================
// GENERATE CONTENT ANGLES
// ===========================================

/**
 * Generate content angles for a campaign based on business type
 * Returns 50 angles (5 pillars × 10 angles each)
 */
export function generateContentAngles(businessType, productContext) {
  const template = PILLAR_TEMPLATES[businessType] || PILLAR_TEMPLATES['ecommerce'];
  const angles = [];
  
  for (const pillar of template.pillars) {
    for (const anglePrompt of pillar.anglePrompts) {
      angles.push({
        pillarId: pillar.id,
        pillarName: pillar.name,
        angleTemplate: anglePrompt,
        angle: personalizeAngle(anglePrompt, productContext),
      });
    }
  }
  
  return {
    businessType: template.name,
    pillars: template.pillars.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      angleCount: p.anglePrompts.length,
    })),
    angles,
    totalAngles: angles.length,
  };
}

/**
 * Personalize an angle template with product context
 */
function personalizeAngle(template, context) {
  if (!context) return template;
  
  let angle = template;
  
  // Replace placeholders with context
  const replacements = {
    '[product]': context.productName || '[product]',
    '[category]': context.category || '[category]',
    '[result]': context.mainBenefit || '[result]',
    '[goal]': context.mainBenefit || '[goal]',
    '[activity]': context.activity || '[activity]',
    '[number]': String(Math.floor(Math.random() * 47) + 3), // Random odd-ish number
    '[timeframe]': ['2 weeks', '30 days', '6 weeks', '3 months'][Math.floor(Math.random() * 4)],
    '[time]': ['5 minutes', '10 minutes', '30 minutes'][Math.floor(Math.random() * 3)],
    '[hours]': String(Math.floor(Math.random() * 5) + 2),
    '[minutes]': String(Math.floor(Math.random() * 20) + 5),
  };
  
  for (const [placeholder, value] of Object.entries(replacements)) {
    angle = angle.replace(new RegExp(placeholder.replace(/[[\]]/g, '\\$&'), 'g'), value);
  }
  
  return angle;
}

/**
 * Get pillar by ID
 */
export function getPillarById(businessType, pillarId) {
  const template = PILLAR_TEMPLATES[businessType] || PILLAR_TEMPLATES['ecommerce'];
  return template.pillars.find(p => p.id === pillarId);
}

/**
 * Get all pillars for a business type
 */
export function getPillarsForBusiness(businessType) {
  const template = PILLAR_TEMPLATES[businessType] || PILLAR_TEMPLATES['ecommerce'];
  return template.pillars;
}

/**
 * Select random angles from each pillar for a campaign
 * Returns a balanced mix: 2 angles per pillar = 10 total for a standard campaign
 */
export function selectCampaignAngles(businessType, anglesPerPillar = 2) {
  const template = PILLAR_TEMPLATES[businessType] || PILLAR_TEMPLATES['ecommerce'];
  const selected = [];
  
  for (const pillar of template.pillars) {
    // Shuffle and take first N
    const shuffled = [...pillar.anglePrompts].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, anglesPerPillar);
    
    for (const angle of chosen) {
      selected.push({
        pillarId: pillar.id,
        pillarName: pillar.name,
        angle,
      });
    }
  }
  
  return selected;
}

// ===========================================
// HOOK TYPE TO PILLAR MAPPING
// ===========================================

/**
 * Map old hook types to delivery mechanisms
 * Hook types are HOW you deliver content, pillars are WHAT you say
 */
export const DELIVERY_MECHANISMS = {
  'problem-solution': {
    name: 'Problem → Solution',
    description: 'Open with frustration, end with relief',
    promptAddition: 'Frame this as: problem experienced → discovery of solution → result',
  },
  'transformation': {
    name: 'Transformation',
    description: 'Before/after emotional journey',
    promptAddition: 'Frame this as: where I was → the change → where I am now',
  },
  'discovery': {
    name: 'Discovery',
    description: 'Share a finding or realization',
    promptAddition: 'Frame this as: what I learned → why it matters → what to do about it',
  },
  'social-proof': {
    name: 'Social Proof',
    description: 'Reference others\' experiences',
    promptAddition: 'Frame this as: what others noticed/asked → the context → the recommendation',
  },
  'comparison': {
    name: 'Comparison',
    description: 'Why this beats alternatives',
    promptAddition: 'Frame this as: what I tried before → why it didn\'t work → what I use now',
  },
};

/**
 * Combine pillar angle with delivery mechanism for Claude prompt
 */
export function buildContentPrompt(pillar, angle, deliveryMechanism, productContext) {
  const mechanism = DELIVERY_MECHANISMS[deliveryMechanism] || DELIVERY_MECHANISMS['discovery'];
  
  return `
CONTENT PILLAR: ${pillar.name}
ANGLE: ${angle}

DELIVERY MECHANISM: ${mechanism.name}
${mechanism.promptAddition}

PRODUCT CONTEXT:
- Product: ${productContext.productName}
- Benefit: ${productContext.productBenefit}
- Audience: ${productContext.targetAudience}
`;
}

// ===========================================
// EXPORTS
// ===========================================

export default {
  PILLAR_TEMPLATES,
  DELIVERY_MECHANISMS,
  generateContentAngles,
  getPillarById,
  getPillarsForBusiness,
  selectCampaignAngles,
  buildContentPrompt,
};
