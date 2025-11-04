import type React from "react"

export default function MyKitsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="my-kits-layout">
      {children}

      {/* Client-side script to load kits from localStorage */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', function() {
              try {
                const kitsContainer = document.getElementById('kits-container');
                const savedKits = localStorage.getItem('drumkitzz-kits');
                
                if (savedKits && kitsContainer) {
                  const kits = JSON.parse(savedKits);
                  
                  if (kits.length > 0) {
                    // Clear the placeholder message
                    const placeholder = document.querySelector('.col-span-full');
                    if (placeholder) placeholder.style.display = 'none';
                    
                    // Render each kit
                    kits.forEach(kit => {
                      const kitElement = document.createElement('div');
                      kitElement.className = 'bg-card rounded-lg overflow-hidden border hover:shadow-md transition-shadow';
                      kitElement.innerHTML = \`
                        <div class="aspect-square relative">
                          <img src="\${kit.image}" alt="\${kit.name}" class="object-cover w-full h-full" />
                        </div>
                        <div class="p-4">
                          <h3 class="font-medium mb-1">\${kit.name}</h3>
                          <p class="text-sm text-muted-foreground mb-3">\${kit.sliceCount} slices</p>
                          <div class="flex justify-between items-center">
                            <a href="/my-kits/\${kit.id}" class="text-sm text-blue-600 hover:underline">View Details</a>
                            <button class="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="mr-1"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                              Download
                            </button>
                          </div>
                        </div>
                      \`;
                      kitsContainer.appendChild(kitElement);
                    });
                  }
                }
                
                // For the kit details page
                const kitId = window.location.pathname.split('/').pop();
                if (kitId && savedKits && window.location.pathname.includes('/my-kits/')) {
                  const kits = JSON.parse(savedKits);
                  const kit = kits.find(k => k.id === kitId);
                  
                  if (kit) {
                    // Update kit details
                    const nameElement = document.getElementById('kit-name');
                    const dateElement = document.getElementById('kit-date');
                    const sliceCountElement = document.getElementById('slice-count');
                    
                    if (nameElement) nameElement.textContent = kit.name;
                    if (dateElement) {
                      const date = new Date(kit.createdAt);
                      dateElement.textContent = 'Created on: ' + date.toLocaleDateString();
                    }
                    if (sliceCountElement) sliceCountElement.textContent = kit.sliceCount.toString();
                    
                    // Generate sample rows
                    const samplesContainer = document.getElementById('kit-samples');
                    if (samplesContainer) {
                      samplesContainer.innerHTML = '';
                      
                      // Generate some sample rows based on slice count
                      const types = ['Kick', 'Snare', 'Hat', 'Perc', 'Tom', 'Cymbal'];
                      for (let i = 1; i <= kit.sliceCount; i++) {
                        const type = types[Math.floor(Math.random() * types.length)];
                        const duration = (Math.random() * 0.5 + 0.1).toFixed(2);
                        
                        const row = document.createElement('div');
                        row.className = 'p-4 grid grid-cols-12 gap-4 items-center hover:bg-muted/50';
                        row.innerHTML = \`
                          <div class="col-span-1 font-medium">\${i}</div>
                          <div class="col-span-5">\${kit.name}_\${type}_\${i}</div>
                          <div class="col-span-2">\${type}</div>
                          <div class="col-span-2">\${duration}s</div>
                          <div class="col-span-2 flex gap-2">
                            <button class="p-1 rounded-md hover:bg-muted">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                            </button>
                            <button class="p-1 rounded-md hover:bg-muted">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            </button>
                          </div>
                        \`;
                        samplesContainer.appendChild(row);
                      }
                    }
                  }
                }
              } catch (error) {
                console.error('Error loading kits:', error);
              }
            });
          `,
        }}
      />
    </div>
  )
}
