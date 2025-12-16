import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Music, Headphones, Shirt, Globe, MapPin, Download, Clock, AlertCircle, Play, Package, Star, Users, FileAudio, Guitar, Piano, Drum, Mic, Volume2 } from "lucide-react";
import WhatsAppChat from "@/components/WhatsAppChat";
import { formatPrice } from "@/lib/priceFormatter";

const Shop = () => {
  const [activeTab, setActiveTab] = useState("digital");

  return (
    <>
      <Header />
      <main className="bg-gradient-to-br from-[#f8f6ff] via-[#f9f7fd] to-[#f6f8ff] py-0 px-0">
        <div className="max-w-7xl mx-auto flex flex-col gap-8 pt-32 lg:pt-36 pb-20 px-4 md:px-8">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent mb-4">Shop</h1>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-6">
              Explore our curated selection of digital performance tracks, musical instruments, accessories, and official Damon Music Academy merchandise.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1 sm:gap-2">
                <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Global Digital Products</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Kenya Physical Products</span>
              </div>
            </div>
            <Badge variant="secondary" className="mt-4 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2">
              <span className="font-semibold text-primary">PC View Only</span> • Payment & Mobile Support Coming Soon
            </Badge>
          </div>

          {/* Main Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="w-full mb-8">
              {/* Desktop Navigation */}
              <TabsList className="hidden sm:flex w-full gap-1 bg-white/90 shadow-lg rounded-lg p-1">
                <TabsTrigger value="digital" className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md font-semibold text-primary data-[state=active]:bg-primary/10 data-[state=active]:shadow-md transition-all text-sm">
                  <Music className="w-4 h-4" />
                  <span>Performance Tracks & Scores</span>
                  <Badge variant="outline" className="ml-1 text-xs">Global</Badge>
                </TabsTrigger>
                <TabsTrigger value="instruments" className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md font-semibold text-accent data-[state=active]:bg-accent/10 data-[state=active]:shadow-md transition-all text-sm">
                  <Headphones className="w-4 h-4" />
                  <span>Instruments & Accessories</span>
                  <Badge variant="outline" className="ml-1 text-xs">Kenya</Badge>
                </TabsTrigger>
                <TabsTrigger value="merch" className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md font-semibold text-secondary data-[state=active]:bg-secondary/10 data-[state=active]:shadow-md transition-all text-sm">
                  <Shirt className="w-4 h-4" />
                  <span>Merchandise</span>
                  <Badge variant="outline" className="ml-1 text-xs">Kenya</Badge>
                </TabsTrigger>
              </TabsList>

              {/* Mobile Dropdown Navigation */}
              <div className="sm:hidden">
                <select 
                  value={activeTab} 
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-200 bg-white shadow-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="digital">
                    🎵 Performance Tracks & Scores (Global)
                  </option>
                  <option value="instruments">
                    🎧 Instruments & Accessories (Kenya)
                  </option>
                  <option value="merch">
                    👕 Merchandise (Kenya)
                  </option>
                </select>
              </div>
            </div>

            {/* Digital Products Tab */}
            <TabsContent value="digital" className="mt-8">
              <div className="space-y-8">
                {/* Hymn Performance Tracks Section */}
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Hymn Performance Tracks</h2>
                    <p className="text-muted-foreground">High-quality instrumental backing tracks for popular public domain gospel hymns.</p>
                    <div className="flex items-center gap-4 mt-3">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Download className="w-3 h-3 mr-1" />
                        WAV & MP3
                      </Badge>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Globe className="w-3 h-3 mr-1" />
                        Global Sales
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Hymn Track Cards */}
                    {[
                      { name: "Amazing Grace", key: "C", duration: "3:45", price: 500 },
                      { name: "How Great Thou Art", key: "D", duration: "4:12", price: 500 },
                      { name: "It Is Well", key: "E", duration: "3:58", price: 500 },
                      { name: "Great Is Thy Faithfulness", key: "F", duration: "4:30", price: 500 },
                      { name: "What A Friend We Have In Jesus", key: "G", duration: "3:20", price: 500 },
                      { name: "The Old Rugged Cross", key: "A", duration: "4:05", price: 500 }
                    ].map((hymn, index) => (
                      <Card key={index} className="group border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white/95 hover:-translate-y-1 flex flex-col h-full max-h-[420px]">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-xs">Key: {hymn.key}</Badge>
                            <Badge variant="outline" className="text-xs">{hymn.duration}</Badge>
                          </div>
                          <CardTitle className="text-sm font-bold mt-1 line-clamp-1">Hymn: {hymn.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 pb-3 flex-1 flex flex-col">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Music className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-base text-primary">{formatPrice(hymn.price)}</div>
                              <div className="text-xs text-muted-foreground">Per track</div>
                            </div>
                          </div>
                          
                          <div className="space-y-1 mb-3 flex-1">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Download className="w-3 h-3" />
                              <span>WAV & MP3</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Package className="w-3 h-3" />
                              <span>Instant download</span>
                            </div>
                          </div>
                          
                          <Button variant="outline" className="w-full text-sm py-2" disabled>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Add to Cart
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {/* Bundle Offer */}
                  <Card className="mt-8 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-primary">Bundle Offer</CardTitle>
                      <CardDescription>Get 5 tracks for the price of 4!</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-primary">{formatPrice(2000)}</div>
                          <div className="text-sm text-muted-foreground">Save KES 500 on 5-track bundle</div>
                        </div>
                        <Button variant="default" disabled>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Buy Bundle
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                {/* Custom Performance Tracks Section */}
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Custom Performance Track Service</h2>
                    <p className="text-muted-foreground">Order a bespoke instrumental backing track for any song (gospel, original, etc.).</p>
                    <div className="flex items-center gap-4 mt-3">
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        <Clock className="w-3 h-3 mr-1" />
                        5-10 Business Days
                      </Badge>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        <Star className="w-3 h-3 mr-1" />
                        Custom Quote
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Service Details */}
                    <Card className="shadow-lg border-0 bg-white/95">
                      <CardHeader>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                          <Mic className="w-6 h-6 text-purple-600" />
                          Custom Track Creation
                        </CardTitle>
                        <CardDescription>Professional instrumental backing tracks tailored to your needs</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-purple-600">1</span>
                            </div>
                            <div>
                              <div className="font-semibold">Submit Your Request</div>
                              <div className="text-sm text-muted-foreground">Fill out our detailed inquiry form</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-purple-600">2</span>
                            </div>
                            <div>
                              <div className="font-semibold">Receive Quote</div>
                              <div className="text-sm text-muted-foreground">Custom pricing based on complexity</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-purple-600">3</span>
                            </div>
                            <div>
                              <div className="font-semibold">Production & Delivery</div>
                              <div className="text-sm text-muted-foreground">5-10 business days after payment</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-yellow-800">
                              <div className="font-semibold mb-1">Copyright Notice</div>
                              <div>For copyrighted songs, the client is solely responsible for obtaining any necessary mechanical, synchronization, or public performance licenses for their use and distribution of the final track. Damon Music Academy provides the instrumental production service only.</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Pricing & Request Form */}
                    <Card className="shadow-lg border-0 bg-white/95">
                      <CardHeader>
                        <CardTitle className="text-xl font-bold">Pricing & Request</CardTitle>
                        <CardDescription>Get a custom quote for your project</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-semibold">Basic Track</div>
                              <div className="text-sm text-muted-foreground">Simple instrumentation</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-primary">{formatPrice(3000)}</div>
                              <div className="text-xs text-muted-foreground">Starting price</div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-semibold">Full Arrangement</div>
                              <div className="text-sm text-muted-foreground">Multiple instruments</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-primary">{formatPrice(5000)}</div>
                              <div className="text-xs text-muted-foreground">Most popular</div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-semibold">Premium Track</div>
                              <div className="text-sm text-muted-foreground">Full production</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-primary">KES 10,000+</div>
                              <div className="text-xs text-muted-foreground">Complex arrangements</div>
                            </div>
                          </div>
                        </div>
                        
                        <Button variant="default" className="w-full" disabled>
                          <FileAudio className="w-4 h-4 mr-2" />
                          Request Custom Quote
                        </Button>
                        
                        <div className="text-xs text-muted-foreground text-center">
                          Quote form coming soon in Phase 2
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Instruments & Accessories Tab */}
            <TabsContent value="instruments" className="mt-8">
              <div className="space-y-8">
                {/* Instruments Section */}
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Musical Instruments</h2>
                    <p className="text-muted-foreground">High-quality instruments sourced from our trusted supplier. Ideal for students and musicians.</p>
                    <div className="flex items-center gap-4 mt-3">
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        <Package className="w-3 h-3 mr-1" />
                        Ordered on Demand
                      </Badge>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Clock className="w-3 h-3 mr-1" />
                        3-7 Business Days
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { name: "Student Acoustic Guitar", brand: "Yamaha", price: 15000, image: "/lovable-uploads/guitar.jpg", specs: "3/4 Size, Spruce Top" },
                      { name: "Digital Piano", brand: "Casio", price: 45000, image: "/lovable-uploads/piano.jpg", specs: "88 Keys, Weighted Action" },
                      { name: "Violin Set", brand: "Stentor", price: 25000, image: "/lovable-uploads/guitar.jpg", specs: "4/4 Size, Complete Set" },
                      { name: "Electric Guitar", brand: "Fender", price: 35000, image: "/lovable-uploads/guitar.jpg", specs: "Stratocaster Style" },
                      { name: "Keyboard", brand: "Roland", price: 30000, image: "/lovable-uploads/piano.jpg", specs: "61 Keys, Multiple Sounds" },
                      { name: "Drum Set", brand: "Pearl", price: 55000, image: "/lovable-uploads/guitar.jpg", specs: "5-Piece, Complete Setup" }
                    ].map((instrument, index) => (
                      <Card key={index} className="group border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white/95 hover:-translate-y-1 flex flex-col max-h-[380px]">
                        <div className="relative overflow-hidden">
                          <img 
                            src={instrument.image} 
                            alt={instrument.name} 
                            className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                          <Badge className="absolute top-2 right-2 bg-orange-500 text-xs">On Demand</Badge>
                        </div>
                        <CardHeader className="pb-2 flex-1">
                          <CardTitle className="text-xs font-bold line-clamp-1">{instrument.name}</CardTitle>
                          <CardDescription className="text-xs line-clamp-1">{instrument.brand} • {instrument.specs}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 pb-3">
                          <div className="space-y-2 mb-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-base text-primary">{formatPrice(instrument.price)}</span>
                              <Badge variant="outline" className="text-xs">3-7 days</Badge>
                            </div>
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                <span>On Demand</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                <span>1 year warranty</span>
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" className="w-full text-xs py-2" disabled>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Add to Cart
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Accessories Section */}
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Instrument Accessories</h2>
                    <p className="text-muted-foreground">Essential accessories for various instruments. Limited in-house stock or Ordered on Demand.</p>
                    <div className="flex items-center gap-4 mt-3">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Package className="w-3 h-3 mr-1" />
                        Limited Stock
                      </Badge>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Clock className="w-3 h-3 mr-1" />
                        1-5 Business Days
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[
                      { name: "Guitar Picks (Pack of 10)", price: 500, image: "/lovable-uploads/guitar.jpg", category: "Guitar" },
                      { name: "Guitar Strings Set", price: 1200, image: "/lovable-uploads/guitar.jpg", category: "Guitar" },
                      { name: "Guitar Strap", price: 800, image: "/lovable-uploads/guitar.jpg", category: "Guitar" },
                      { name: "Digital Tuner", price: 1500, image: "/lovable-uploads/guitar.jpg", category: "Universal" },
                      { name: "Metronome", price: 2000, image: "/lovable-uploads/piano.jpg", category: "Universal" },
                      { name: "Cleaning Kit", price: 1800, image: "/lovable-uploads/guitar.jpg", category: "Universal" },
                      { name: "Music Stand", price: 2500, image: "/lovable-uploads/piano.jpg", category: "Universal" },
                      { name: "Violin Rosin", price: 300, image: "/lovable-uploads/guitar.jpg", category: "Violin" }
                    ].map((accessory, index) => (
                      <Card key={index} className="group border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white/95 hover:-translate-y-1 flex flex-col max-h-[260px]">
                        <div className="relative overflow-hidden">
                          <img 
                            src={accessory.image} 
                            alt={accessory.name} 
                            className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                          <Badge className="absolute top-1 right-1 bg-green-500 text-xs px-1 py-0">{accessory.category}</Badge>
                        </div>
                        <CardHeader className="pb-2 flex-1 py-2">
                          <CardTitle className="text-xs font-bold line-clamp-2">{accessory.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 pb-2 px-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm text-primary">{formatPrice(accessory.price)}</span>
                            <Badge variant="outline" className="text-xs">1-5 days</Badge>
                          </div>
                          <Button variant="outline" className="w-full text-xs py-1" disabled>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Add to Cart
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Merchandise Tab */}
            <TabsContent value="merch" className="mt-8">
              <div className="space-y-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Damon Music Academy Merchandise</h2>
                  <p className="text-muted-foreground">Official branded merchandise to show your support for Damon Music Academy.</p>
                  <div className="flex items-center gap-4 mt-3">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      <Shirt className="w-3 h-3 mr-1" />
                      Branded Items
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <Clock className="w-3 h-3 mr-1" />
                      2-7 Business Days
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { name: "Damon Music Academy T-shirt", price: "KES 1,500", image: "/lovable-uploads/founder.jpg", sizes: ["S", "M", "L", "XL"], colors: ["White", "Black"] },
                    { name: "Damon Music Academy Mug", price: "KES 800", image: "/lovable-uploads/piano.jpg", sizes: [], colors: ["White", "Black"] },
                    { name: "Damon Music Academy Hoodie", price: "KES 2,500", image: "/lovable-uploads/guitar.jpg", sizes: ["S", "M", "L", "XL"], colors: ["Gray", "Navy"] },
                    { name: "Damon Music Academy Cap", price: "KES 1,200", image: "/lovable-uploads/founder.jpg", sizes: ["One Size"], colors: ["Black", "White"] },
                    { name: "Damon Music Academy Sticker Pack", price: "KES 300", image: "/lovable-uploads/piano.jpg", sizes: [], colors: ["Assorted"] },
                    { name: "Damon Music Academy Tote Bag", price: "KES 1,000", image: "/lovable-uploads/guitar.jpg", sizes: [], colors: ["Canvas", "Black"] }
                  ].map((item, index) => (
                    <Card key={index} className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/95 hover:-translate-y-1">
                      <div className="relative overflow-hidden">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500" 
                        />
                        <Badge className="absolute top-3 right-3 bg-purple-500">Official</Badge>
                      </div>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold">{item.name}</CardTitle>
                        <CardDescription>Official Damon Music Academy branded merchandise</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xl text-primary">{item.price}</span>
                            <Badge variant="outline" className="text-xs">2-7 days</Badge>
                          </div>
                          
                          {item.sizes.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-sm font-medium">Available Sizes:</div>
                              <div className="flex flex-wrap gap-1">
                                {item.sizes.map((size, sizeIndex) => (
                                  <Badge key={sizeIndex} variant="outline" className="text-xs">{size}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {item.colors.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-sm font-medium">Available Colors:</div>
                              <div className="flex flex-wrap gap-1">
                                {item.colors.map((color, colorIndex) => (
                                  <Badge key={colorIndex} variant="outline" className="text-xs">{color}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <Button variant="outline" className="w-full" disabled>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <WhatsAppChat />
      <Footer />
    </>
  );
};

export default Shop; 