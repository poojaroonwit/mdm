'use client'

import React from 'react'
import { Upload, Video } from 'lucide-react'
import { TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { COLOR_PATTERNS } from './color-utils'

export function ColorPickerPatternMediaTabs(props: any) {
  const {
    isSpaceLayoutConfig,
    currentPattern,
    handlePatternChange,
    getPatternStyle,
    imageUrl,
    handleImageChange,
    value,
    handleImageUpload,
    videoUrl,
    handleVideoChange,
    handleVideoUpload,
  } = props

  return (
    <>              <TabsContent value="pattern" className={`${isSpaceLayoutConfig ? 'py-4' : 'p-4'} space-y-2 mt-0`}>
                <div className="space-y-2">
                  <Label className="text-xs">Pattern</Label>
                  <Select value={currentPattern.id} onValueChange={handlePatternChange}>
                    <SelectTrigger className="h-8 text-xs">
                      <div className="flex items-center gap-2">
                        {React.createElement(currentPattern.icon, { className: "h-3.5 w-3.5" })}
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_PATTERNS.map((pattern) => {
                        const Icon = pattern.icon
                        return (
                          <SelectItem key={pattern.id} value={pattern.id}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-3.5 w-3.5" />
                              <span>{pattern.name}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>

                  {/* Pattern Preview */}
                  <div className="space-y-1">
                    <Label className="text-xs">Preview</Label>
                    <div
                      className="w-full h-16 rounded border bg-background"
                      style={getPatternStyle(currentPattern)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="image" className={`${isSpaceLayoutConfig ? 'py-4' : 'p-4'} space-y-2 mt-0`}>
                <div className="space-y-2">
                  <Input
                    type="text"
                    value={imageUrl.replace(/^url\(|\)$/g, '')}
                    onChange={(e) => handleImageChange(e.target.value)}
                    className="h-8 text-xs"
                    placeholder="Image URL or upload"
                  />
                  <label className="block">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs"
                      onClick={() => {
                        const input = document.getElementById(`image-upload-${value.replace(/[^a-zA-Z0-9]/g, '')}`) as HTMLInputElement
                        input?.click()
                      }}
                    >
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      Upload Image
                    </Button>
                    <input
                      id={`image-upload-${value.replace(/[^a-zA-Z0-9]/g, '')}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                  {imageUrl && (
                    <div className="w-full h-24 rounded border overflow-hidden">
                      <img src={imageUrl.replace(/^url\(|\)$/g, '')} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="video" className={`${isSpaceLayoutConfig ? 'py-4' : 'p-4'} space-y-2 mt-0`}>
                <div className="space-y-2">
                  <Input
                    type="text"
                    value={videoUrl.replace(/^video\(|\)$/g, '')}
                    onChange={(e) => handleVideoChange(e.target.value)}
                    className="h-8 text-xs"
                    placeholder="Video URL or upload"
                  />
                  <label className="block">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs"
                      onClick={() => {
                        const input = document.getElementById(`video-upload-${value.replace(/[^a-zA-Z0-9]/g, '')}`) as HTMLInputElement
                        input?.click()
                      }}
                    >
                      <Video className="h-3.5 w-3.5 mr-1.5" />
                      Upload Video
                    </Button>
                    <input
                      id={`video-upload-${value.replace(/[^a-zA-Z0-9]/g, '')}`}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleVideoUpload}
                    />
                  </label>
                  {videoUrl && (
                    <div className="w-full h-24 rounded border overflow-hidden">
                      <video src={videoUrl.replace(/^video\(|\)$/g, '')} className="w-full h-full object-cover" controls={false} />
                    </div>
                  )}
                </div>
              </TabsContent>
    </>
  )
}