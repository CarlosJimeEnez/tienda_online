<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
</script>

<template>
  <Carousel
    class="w-full max-w-lg mx-auto flex justify-center items-center mt-8"
    :opts="{
      align: 'center',
    }"
  >
    <CarouselContent>
      <CarouselItem v-for="(_, index) in 3" :key="index" class="md:basis-1/2 lg:basis-1/3">
        <div class="p-1">
          <Card>
            <CardContent class="flex  items-center justify-center p-6">
              <span class="text-3xl font-semibold">{{ index + 1 }}</span>
            </CardContent>
          </Card>
        </div>
      </CarouselItem>
    </CarouselContent>
    <CarouselPrevious />
    <CarouselNext />
  </Carousel>
</template>